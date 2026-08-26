import json
import os
import re
import sqlite3
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI

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
        "merge", "producción", "status", "logs", "puerto", "ssl"
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

    if any(token in lower for token in ["vps", "docker", "deploy", "despliegue", "ssh", "tailscale", "ufw", "nginx", "github"]):
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


def orchestrate(request: str) -> dict:
    agent_name = classify(request)
    system_prompt = load_prompt(agent_name)
    if not system_prompt:
        system_prompt = f"Eres el agente especializado {agent_name}."

    client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)
    completion = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request},
        ],
    )
    resultado = completion.choices[0].message.content or ""

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

    client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)
    completion = client.chat.completions.create(
        model=LLM_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": request},
        ],
    )
    resultado = completion.choices[0].message.content or ""
    save_output_md(agent_name, resultado)
    return resultado
