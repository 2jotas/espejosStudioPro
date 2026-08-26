import os
import json
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
BRAIN_PATH = PROJECT_ROOT / "PROJECT_BRAIN.md"

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")


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
            # Security guard for destructive commands
            destructive_keywords = ["rm -rf", "drop table", "mkfs", "dd if=", "prune -f"]
            if any(k in cmd.lower() for k in destructive_keywords):
                return f"⚠️ COMANDO BLOQUEADO POR SEGURIDAD: '{cmd}' requiere confirmación explícita en Telegram."

            res = subprocess.run(cmd, shell=True, cwd=PROJECT_ROOT, capture_output=True, text=True, timeout=60)
            output = res.stdout if res.returncode == 0 else f"Error (code {res.returncode}):\n{res.stderr}"
            return output[:3000]

        return f"Herramienta desconocida: {tool_name}"
    except Exception as e:
        return f"Error ejecutando {tool_name}: {e}"


def run_gemini_agent(user_prompt: str, model_name: str = "gemini-2.5-pro") -> str:
    """
    Ejecuta el agente con Gemini pensando, planeando y resolviendo la tarea
    con la memoria viva de PROJECT_BRAIN.md.
    """
    brain_context = load_project_brain()

    # Si hay API Key de Gemini, usamos Google GenAI SDK / REST
    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        return (
            "⚠️ *Gemini Engine*: Falta configurar `GEMINI_API_KEY` en el archivo `.env` del VPS.\n"
            "Por favor agrega tu clave de Gemini para activar el razonamiento profundo (Thinking Mode)."
        )

    try:
        import urllib.request

        system_instruction = (
            "Eres el Agente Autónomo de Ingeniería de Software de Hermes en el VPS.\n"
            "Tienes la misma capacidad de análisis, diseño y arquitectura que Antigravity 2.0.\n"
            "Usa la memoria viva del proyecto para entender el contexto.\n\n"
            f"--- MEMORIA VIVA (PROJECT_BRAIN.md) ---\n{brain_context[:3500]}\n"
        )

        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_instruction}\n\nSolicitud del usuario:\n{user_prompt}"}]
                }
            ],
            "generationConfig": {
                "temperature": 0.2,
                "maxOutputTokens": 2048
            }
        }

        models_to_try = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]
        last_err = None
        for m_name in models_to_try:
            try:
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{m_name}:generateContent?key={api_key}"
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=45) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    text_response = data["candidates"][0]["content"]["parts"][0]["text"]
                    return text_response
            except Exception as e:
                last_err = e
                continue

        return f"❌ Error ejecutando Gemini Engine: {last_err}"

    except Exception as e:
        return f"❌ Error ejecutando Gemini Engine: {e}"
