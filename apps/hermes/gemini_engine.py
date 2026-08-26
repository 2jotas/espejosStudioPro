import os
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BRAIN_PATH = PROJECT_ROOT / "PROJECT_BRAIN.md"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GROQ_API_KEY = os.getenv("LLM_API_KEY", "")


def load_project_brain() -> str:
    """Carga la memoria viva compartida del proyecto."""
    if BRAIN_PATH.exists():
        return BRAIN_PATH.read_text(encoding="utf-8")
    return "PROJECT_BRAIN.md no encontrado."


def execute_tool(tool_name: str, args: dict) -> str:
    """Ejecutor seguro de herramientas para el agente Hermes."""
    try:
        if tool_name == "view_file":
            file_path = PROJECT_ROOT / args.get("relative_path", "")
            if not file_path.exists():
                return f"Error: El archivo {args.get('relative_path')} no existe."
            return file_path.read_text(encoding="utf-8")[:4000]

        elif tool_name == "list_files":
            rel_dir = PROJECT_ROOT / args.get("relative_dir", "")
            if not rel_dir.exists():
                return f"Error: El directorio {args.get('relative_dir')} no existe."
            files = [str(p.relative_to(PROJECT_ROOT)) for p in rel_dir.glob("*") if not p.name.startswith(".")]
            return json.dumps(files[:50], indent=2)

        elif tool_name == "write_file":
            file_path = PROJECT_ROOT / args.get("relative_path", "")
            content = args.get("content", "")
            file_path.parent.mkdir(parents=True, exist_ok=True)
            file_path.write_text(content, encoding="utf-8")
            return f"Archivo {args.get('relative_path')} guardado con éxito."

        elif tool_name == "run_safe_command":
            cmd = args.get("command", "")
            destructive_keywords = ["rm -rf", "drop table", "mkfs", "dd if=", "prune -f"]
            if any(k in cmd.lower() for k in destructive_keywords):
                return f"⚠️ COMANDO BLOQUEADO POR SEGURIDAD: '{cmd}' requiere confirmación explícita en Telegram."

            res = subprocess.run(cmd, shell=True, cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=60)
            output = res.stdout if res.returncode == 0 else f"Error (code {res.returncode}):\n{res.stderr}"
            return output[:3000]

        return f"Herramienta desconocida: {tool_name}"
    except Exception as e:
        return f"Error ejecutando {tool_name}: {e}"


def run_gemini_agent(user_prompt: str) -> str:
    """
    Ejecuta el agente con Gemini / Groq pensando y planeando con la memoria viva de PROJECT_BRAIN.md.
    """
    brain_context = load_project_brain()

    system_instruction = (
        "Eres el Agente Autónomo de Ingeniería de Software de Hermes en el VPS.\n"
        "Tienes la misma capacidad de análisis, diseño y arquitectura que Antigravity 2.0.\n"
        "Usa la memoria viva del proyecto para entender el contexto.\n\n"
        f"--- MEMORIA VIVA (PROJECT_BRAIN.md) ---\n{brain_context[:3500]}\n"
    )

    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # 1. Si hay clave de Gemini, intentar endpoint oficial OpenAI-compatible de Google
    if api_key:
        candidate_models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]
        client = OpenAI(
            base_url="https://generativelanguage.googleapis.com/v1beta/openai/",
            api_key=api_key,
        )
        for m_name in candidate_models:
            try:
                completion = client.chat.completions.create(
                    model=m_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=2048,
                )
                return f"🧠 *[Google Gemini: {m_name}]*\n\n" + (completion.choices[0].message.content or "")
            except Exception:
                continue

    # 2. Fallback de alta velocidad con Groq + PROJECT_BRAIN.md si Gemini no tiene clave o falla
    groq_key = os.getenv("LLM_API_KEY", GROQ_API_KEY)
    if groq_key:
        client_groq = OpenAI(base_url="https://api.groq.com/openai/v1", api_key=groq_key)
        for m_name in ["openai/gpt-oss-120b", "groq/compound", "qwen/qwen3.8-27b"]:
            try:
                completion = client_groq.chat.completions.create(
                    model=m_name,
                    messages=[
                        {"role": "system", "content": system_instruction},
                        {"role": "user", "content": user_prompt},
                    ],
                    max_tokens=2048,
                )
                return f"🧠 *[Brain Engine: {m_name}]*\n\n" + (completion.choices[0].message.content or "")
            except Exception:
                continue

    return "❌ No se pudo procesar la solicitud con ninguno de los motores disponibles."
