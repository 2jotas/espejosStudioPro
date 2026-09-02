import json
import os
import re
import sqlite3
import subprocess
from pathlib import Path
from datetime import datetime

from dotenv import load_dotenv
from openai import OpenAI
import tools

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
AGENTS_DIR = BASE_DIR / "agents"
OUTPUTS_DIR = BASE_DIR / "outputs"
DB_PATH = BASE_DIR / "tasks.db"

OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.groq.com/openai/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_MODEL = os.getenv("LLM_MODEL", "groq/compound")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

AGENTS = {
    "devops": AGENTS_DIR / "agente_devops.md",
    "espejos": AGENTS_DIR / "agente_espejos.md",
    "trading": AGENTS_DIR / "agente_trading.md",
    "universidad": AGENTS_DIR / "agente_universidad.md",
    "contenido": AGENTS_DIR / "agente_contenido.md",
}

KEYWORDS = {
    "devops": [
        "atlas", "vps", "docker", "deploy", "despliegue", "ssh", "tailscale",
        "ufw", "firewall", "nginx", "servidor", "github", "pr", "commit",
        "merge", "producción", "status", "logs", "puerto", "ssl", "nodo", "laptop", "reiniciar", "reinicia"
    ],
    "espejos": [
        "romina", "crm", "gravity", "clientes", "agenda", "citas", "servicios",
        "barberos", "estilistas", "dashboard", "negocio", "retención",
        "experiencia", "personalización", "cliente activo", "turno",
        "reserva", "confirmación", "recordatorio", "profesional", "prestador",
        "barbería", "visagismo", "manicurista", "masajista", "estética", "agendamiento"
    ],
    "trading": [
        "mercurio", "quant", "trading", "bolsa", "bitcoin", "btc", "eth", "sol",
        "cripto", "acciones", "mercado", "rsi", "macd", "backtest", "backtesting",
        "finanzas", "activos", "drawdown", "sharpe", "velas", "precio", "cotizacion", "cotización", "dólar", "dolar"
    ],
    "contenido": [
        "apolo", "tiktok", "reel", "youtube", "guion", "copy", "imagen", "viral",
        "redes", "monetizar", "shorts", "cta", "hook", "gancho", "producto digital",
        "copywriting", "contenido", "publicidad", "anuncio", "funnel", "embudo",
        "seguidores", "estrategia", "feed", "público objetivo", "afiliados", "auto.espejosstudio.cl"
    ],
    "universidad": [
        "athena", "estadistica", "matematicas", "sql", "python", "datos", "r",
        "apuntes", "rag", "machine learning", "estudio", "probabilidad",
        "regresión", "clustering", "pandas", "numpy", "scikit", "deep learning",
        "streamlit", "chromadb", "embeddings", "chunking", "modelo",
        "dataset", "dataframe", "algoritmo", "consulta", "query", "join",
        "índice", "ventana", "window", "explicar", "investigación", "carrera", "vault"
    ],
}


def classify(text: str) -> str:
    lower = text.lower()
    scores = {name: 0 for name in KEYWORDS}
    for name, words in KEYWORDS.items():
        for w in words:
            if re.search(rf"\b{re.escape(w)}\b", lower):
                scores[name] += 1

    if any(token in lower for token in ["atlas", "vps", "docker", "deploy", "despliegue", "ssh", "tailscale", "ufw", "nginx", "logs", "reiniciar"]):
        scores["devops"] += 3

    if any(token in lower for token in ["romina", "crm", "agenda", "citas", "barbería", "visagismo"]):
        scores["espejos"] += 3

    if any(token in lower for token in ["mercurio", "quant", "trading", "bolsa", "bitcoin", "btc", "eth", "rsi", "backtesting"]):
        scores["trading"] += 3

    if any(token in lower for token in ["apolo", "tiktok", "reel", "youtube", "guion", "viral", "copy", "producto digital"]):
        scores["contenido"] += 3

    if any(token in lower for token in ["athena", "estadistica", "matematicas", "sql", "python", "rag", "machine learning", "vault", "apuntes"]):
        scores["universidad"] += 3

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


def get_realtime_system_context(agent_name: str, request: str) -> str:
    """Ejecuta herramientas en vivo para nutrir el contexto del agente con datos del sistema."""
    lower = request.lower()
    context_data = ""

    # 1. Herramientas DevOps / Atlas
    if agent_name == "devops" or any(k in lower for k in ["docker", "vps", "logs", "status", "reinicia", "contenedor"]):
        if "log" in lower:
            for cont in ["espejos-api", "espejos-web", "espejos-hermes", "espejos-formacion", "espejos-gateway"]:
                if cont in lower:
                    context_data += f"\n{tools.docker_logs(cont, tail=20)}\n"
        if not context_data:
            context_data += f"\n{tools.docker_ps()}\n"

    # 2. Herramientas CRM / Romina
    if agent_name == "espejos" or any(k in lower for k in ["citas", "agenda", "clientes", "reservas", "ingresos"]):
        context_data += f"\n{tools.query_crm_summary()}\n"

    # 3. Herramientas Trading / Mercurio
    if agent_name == "trading" or any(k in lower for k in ["btc", "bitcoin", "eth", "ethereum", "sol", "precio", "crypto", "accion", "sp500"]):
        symbols = []
        if "btc" in lower or "bitcoin" in lower:
            symbols.append("BTC-USD")
        if "eth" in lower or "ethereum" in lower:
            symbols.append("ETH-USD")
        if "sol" in lower or "solana" in lower:
            symbols.append("SOL-USD")
        if "spy" in lower or "sp500" in lower or "bolsa" in lower:
            symbols.append("SPY")
        if "nvda" in lower or "nvidia" in lower:
            symbols.append("NVDA")
        if not symbols:
            symbols.append("BTC-USD")

        for sym in symbols[:2]:
            context_data += f"\n{tools.get_market_quote(sym)}\n"

    # 4. Herramientas Universidad / Athena
    if agent_name == "universidad" or "vault" in lower:
        # Extraer posible materia de búsqueda
        words = [w for w in request.split() if len(w) > 4 and w.lower() not in ["explica", "resume", "busca", "sobre"]]
        search_term = words[0] if words else "python"
        context_data += f"\n{tools.search_vault_notes(search_term)}\n"

    return context_data


def call_llm_with_fallback(system_prompt: str, user_request: str, agent_name: str) -> str:
    print(f"[Orchestrator] Getting realtime context for agent '{agent_name}'...", flush=True)
    realtime_context = get_realtime_system_context(agent_name, user_request)

    full_user_request = (
        f"{user_request}\n\n"
        f"--- DATOS REALES EN VIVO DEL SISTEMA / HERRAMIENTAS ---\n"
        f"{realtime_context}"
    ) if realtime_context else user_request

    # 1. Intentar con Google Gemini (Flash Latest, 3.5 Flash)
    if GEMINI_API_KEY:
        gemini_candidates = ["gemini-flash-latest", "gemini-3.5-flash"]
        client_gemini = OpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=GEMINI_API_KEY.strip(),
            timeout=5.0
        )
        for g_model in gemini_candidates:
            try:
                print(f"[Orchestrator] Trying Gemini model: {g_model}...", flush=True)
                completion = client_gemini.chat.completions.create(
                    model=g_model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": full_user_request}
                    ],
                    max_tokens=2048,
                    timeout=5.0
                )
                content = completion.choices[0].message.content
                if content:
                    print(f"[Orchestrator] Gemini {g_model} succeeded ({len(content)} chars)!", flush=True)
                    return content
            except Exception as e:
                print(f"[Orchestrator] Gemini {g_model} error: {e}", flush=True)
                if "429" in str(e) or "quota" in str(e).lower():
                    print("[Orchestrator] Gemini quota reached (429), switching instantly to Groq LPU...", flush=True)
                    break
                continue

    # 2. Fallback de ultra-alta velocidad con Groq (GPT-OSS-120B, Qwen 3.8 27B)
    candidate_models = ["openai/gpt-oss-120b", "qwen/qwen3.8-27b"]
    print(f"[Orchestrator] Falling back to Groq models...", flush=True)
    client = OpenAI(base_url=LLM_BASE_URL, api_key=LLM_API_KEY, timeout=5.0)

    last_err = None
    for model_id in candidate_models:
        if not model_id:
            continue
        try:
            print(f"[Orchestrator] Trying Groq model: {model_id}...", flush=True)
            completion = client.chat.completions.create(
                model=model_id,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": full_user_request},
                ],
                max_tokens=2048,
                timeout=15.0
            )
            out = completion.choices[0].message.content or ""
            print(f"[Orchestrator] Groq {model_id} succeeded ({len(out)} chars)!", flush=True)
            return out
        except Exception as e:
            print(f"[Orchestrator] Groq {model_id} error: {e}", flush=True)
            last_err = e
            continue

    raise RuntimeError(f"Error procesando la solicitud con LLM: {last_err}")


def orchestrate(request: str) -> dict:
    agent_name = classify(request)
    system_prompt = load_prompt(agent_name)
    if not system_prompt:
        system_prompt = f"Eres el agente especializado {agent_name}."

    resultado = call_llm_with_fallback(system_prompt, request, agent_name)

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
        "modelo": "gemini-2.0-flash / groq",
        "resultado": resultado,
        "archivo_salida": str(md_path),
    }


def run_specific_agent(agent_name: str, request: str) -> str:
    if agent_name not in AGENTS:
        raise ValueError(f"Agente '{agent_name}' no registrado.")

    system_prompt = load_prompt(agent_name)
    if not system_prompt:
        system_prompt = f"Eres el agente especializado {agent_name}."

    resultado = call_llm_with_fallback(system_prompt, request, agent_name)
    save_output_md(agent_name, resultado)
    return resultado
