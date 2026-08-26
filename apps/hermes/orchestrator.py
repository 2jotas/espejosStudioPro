import json
import os
import re
import sqlite3
import subprocess
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI
import self_tuner as tuner

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
AGENTS_DIR = BASE_DIR / "agents"
OUTPUTS_DIR = BASE_DIR / "outputs"
DB_PATH = BASE_DIR / "tasks.db"

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "groq/compound")

AGENTS = {
    "universidad": AGENTS_DIR / "agente_universidad.md",
    "espejos": AGENTS_DIR / "agente_espejos.md",
    "contenido": AGENTS_DIR / "agente_contenido.md",
    "devops": AGENTS_DIR / "agente_devops.md",
}

KEYWORDS = {
    "devops": [
        "vps", "docker", "deploy", "despliegue", "ssh", "tailscale",
        "ufw", "firewall", "nginx", "servidor", "github", "pr", "commit",
        "merge", "producción", "status", "logs", "puerto", "ssl", "nodo", "laptop"
    ],
    "espejos": [
        "crm", "gravity", "clientes", "agenda", "citas", "servicios",
        "barberos", "estilistas", "dashboard", "negocio", "retención",
        "experiencia", "personalización", "cliente activo", "turno",
        "reserva", "confirmación", "recordatorio", "profesional", "prestador",
        "barbería", "manicurista", "masajista", "estética", "agendamiento"
    ],
    "contenido": [
        "tiktok", "reel", "youtube", "guion", "copy", "imagen", "viral",
        "redes", "monetizar", "shorts", "cta", "hook", "gancho",
        "gemini", "copywriting", "contenido", "publicidad", "anuncio",
        "seguidores", "estrategia", "feed", "público objetivo", "afiliados",
        "sponsors", "hashtag", "embudo", "lead magnet"
    ],
    "universidad": [
        "estadistica", "matematicas", "sql", "python", "datos", "r",
        "apuntes", "rag", "machine learning", "estudio", "probabilidad",
        "regresión", "clustering", "pandas", "numpy", "scikit",
        "streamlit", "chromadb", "embeddings", "chunking", "modelo",
        "dataset", "dataframe", "algoritmo", "consulta", "query", "join",
        "índice", "ventana", "window", "explicar", "investigación"
    ],
}


def classify(text: str) -> str:
    lower = text.lower()
    scores = {name: 0 for name in KEYWORDS}
    for name, words in KEYWORDS.items():
        for w in words:
            if re.search(rf"\b{re.escape(w)}\b", lower):
                scores[name] += 1

    if any(token in lower for token in ["vps", "docker", "deploy", "despliegue", "ssh", "tailscale", "ufw", "nginx", "github", "nodo", "laptop"]):
        scores["devops"] += 2

    if any(token in lower for token in ["crm", "gravity", "agenda", "citas", "barberos", "estilistas", "dashboard"]):
        scores["espejos"] += 2

    if any(token in lower for token in ["tiktok", "reel", "youtube", "guion", "viral", "gemini", "copy"]):
        scores["contenido"] += 2

    if any(token in lower for token in ["estadistica", "matematicas", "sql", "python", "rag", "machine learning", "apuntes"]):
        scores["universidad"] += 2

    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "devops"
    return best


def load_prompt(agent_name: str) -> str:
    path = AGENTS.get(agent_name)
    if not path or not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def ensure_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute(
        """
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            categoria TEXT NOT NULL,
            titulo TEXT NOT NULL,
            estado TEXT NOT NULL,
            resultado TEXT
        )
        """
    )
    conn.commit()
    return conn


def save_task(conn, categoria, titulo, estado, resultado):
    c = conn.cursor()
    c.execute(
        "INSERT INTO tasks (categoria, titulo, estado, resultado) VALUES (?, ?, ?, ?)",
        (categoria, titulo, estado, resultado),
    )
    conn.commit()
    return c.lastrowid


def save_output_md(categoria: str, content: str) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{categoria}_{timestamp}.md"
    path = OUTPUTS_DIR / filename
    path.write_text(content, encoding="utf-8")
    return path


def get_system_context(request: str) -> str:
    lower = request.lower()
    context_info = ""
    if any(k in lower for k in ["tailscale", "ping", "nodo", "laptop", "100.93.43.122"]):
        try:
            ping_res = subprocess.run(["ping", "-c", "2", "100.93.43.122"], capture_output=True, text=True, timeout=5)
            context_info += f"\n[DATOS REALES DE RED TAILSCALE (PING A LAPTOP 100.93.43.122)]:\n{ping_res.stdout}\n"
        except Exception as e:
            tune_msg = tuner.auto_tune_missing_tool(str(e))
            if tune_msg:
                try:
                    retry_ping = subprocess.run(["ping", "-c", "2", "100.93.43.122"], capture_output=True, text=True, timeout=5)
                    context_info += f"\n{tune_msg}\n[DATOS REALES DE RED TAILSCALE RE-INTENTO]:\n{retry_ping.stdout}\n"
                except Exception as e2:
                    context_info += f"\n[DATOS REALES DE RED TAILSCALE]: Error pinging laptop: {e2}\n"
            else:
                context_info += f"\n[DATOS REALES DE RED TAILSCALE]: Error pinging laptop: {e}\n"

    if any(k in lower for k in ["docker", "vps", "servidor", "status", "infraestructura"]):
        try:
            ps_res = subprocess.run(["docker", "ps"], capture_output=True, text=True, timeout=5)
            context_info += f"\n[DATOS REALES DE CONTENEDORES DOCKER EN VPS]:\n{ps_res.stdout}\n"
        except Exception as e:
            tune_msg = tuner.auto_tune_missing_tool(str(e))
            context_info += f"\n[DATOS REALES DOCKER]: Error querying docker: {e}\n"

    return context_info


def call_llm_with_fallback(system_prompt: str, user_request: str) -> str:
    extra_context = get_system_context(user_request)
    if extra_context:
        full_user_request = f"{user_request}\n\n{extra_context}"
    else:
        full_user_request = user_request

    candidate_models = [LLM_MODEL, "openai/gpt-oss-120b", "groq/compound", "qwen/qwen3.8-27b"]
    client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)

    last_err = None
    for model_id in candidate_models:
        if not model_id:
            continue
        try:
            completion = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_user_request},
                ],
                max_tokens=2048,
            )
            return completion.choices[0].message.content or ""
        except Exception as e:
            last_err = e
            continue
    raise RuntimeError(f"Error procesando la solicitud con LLM: {last_err}")


def orchestrate(request: str) -> dict:
    agent_name = classify(request)
    system_prompt = load_prompt(agent_name)
    if not system_prompt:
        system_prompt = f"Eres el agente especializado {agent_name}."

    resultado = call_llm_with_fallback(system_prompt, request)

    conn = ensure_db()
    save_task(
        conn,
        categoria=agent_name,
        titulo=request[:120],
        estado="completada",
        resultado=resultado,
    )
    conn.close()

    md_path = save_output_md(agent_name, resultado)

    return {
        "solicitud": request,
        "agente_asignado": agent_name,
        "archivo_agente": str(AGENTS.get(agent_name, "")),
        "prompt_agente": system_prompt[:400],
        "modelo": LLM_MODEL,
        "resultado": resultado,
        "archivo_salida": str(md_path),
    }


def run_specific_agent(agent_name: str, request: str) -> str:
    if agent_name not in AGENTS:
        raise ValueError(f"Agente '{agent_name}' no registrado.")

    system_prompt = load_prompt(agent_name)
    if not system_prompt:
        system_prompt = f"Eres el agente especializado {agent_name}."

    resultado = call_llm_with_fallback(system_prompt, request)
    save_output_md(agent_name, resultado)
    return resultado
