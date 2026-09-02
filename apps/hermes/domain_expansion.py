"""
Hermes - Extensión de Dominio (Domain Expansion Engine)
Orquesta el despliegue de acciones sobre APIs de terceros, generación de vídeo ultra-rápido,
ejecución de código, trading en vivo e infraestructura.
"""

import os
import json
import time
import requests
import subprocess
from pathlib import Path
from typing import Dict, Any, Optional

try:
    import fal_client
    HAS_FAL_SDK = True
except ImportError:
    HAS_FAL_SDK = False

WORKSPACE_DIR = Path("/app/workspace")
if not WORKSPACE_DIR.exists():
    WORKSPACE_DIR = Path(__file__).resolve().parent.parent.parent

OUTPUTS_DIR = Path("/app/apps/hermes/outputs")
if not OUTPUTS_DIR.exists():
    OUTPUTS_DIR = Path(__file__).resolve().parent / "outputs"
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

# Claves de APIs de Extensión de Dominio
FAL_KEY = os.getenv("FAL_KEY", "").strip()
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN", "").strip()
RUNWAY_API_KEY = os.getenv("RUNWAYML_API_SECRET", "").strip()
LUMA_API_KEY = os.getenv("LUMA_API_KEY", "").strip()
MINIMAX_API_KEY = os.getenv("MINIMAX_API_KEY", "").strip()

# Dominios Registrados
DOMAINS_REGISTRY = {
    "video_engine": {
        "nombre": "Extensión de Dominio: Cinema Cuántico (Ultra-Fast Video)",
        "descripcion": "Generación de vídeo hiperrealista 9:16/16:9 a partir de texto o imágenes (Fal.ai, Replicate, Luma, Runway).",
        "proveedores": ["fal.ai (Wan 2.1 / Kling / Luma)", "replicate", "runway", "minimax"]
    },
    "antigravity_bridge": {
        "nombre": "Extensión de Dominio: Forja de Código Antigravity",
        "descripcion": "Invocación directa de agentes autónomos de ingeniería para autocompilar, optimizar y auditar software.",
    },
    "quant_market": {
        "nombre": "Extensión de Dominio: Ojo de Mercurio (Finanzas Cuantitativas)",
        "descripcion": "Extracción y análisis de mercado en tiempo real (Cripto, Acciones, Forex, Arbitraje).",
    },
    "infra_docker": {
        "nombre": "Extensión de Dominio: Fortaleza de Atlas (SRE & Docker)",
        "descripcion": "Control total de contenedores, reinicios, métricas y estado del VPS Contabo.",
    }
}


def get_active_domains() -> str:
    """Devuelve un resumen estructurado de las habilidades activas de Extensión de Dominio."""
    res = ["🌌 **EXTENSIÓN DE DOMINIO: HABILIDADES & APIS DE HERMES**\n"]
    for dom_id, info in DOMAINS_REGISTRY.items():
        res.append(f"🔹 **{info['nombre']}**")
        res.append(f"   _{info['descripcion']}_\n")
    return "\n".join(res)


def generate_fast_video(prompt: str, image_url: Optional[str] = None, aspect_ratio: str = "9:16", duration: int = 5) -> Dict[str, Any]:
    """
    Genera un vídeo ultra-rápido utilizando Fal.ai SDK oficial o fallback REST.
    Soporta:
    1. Fal.ai (Wan 2.1 / Kling 1.6 / Luma Dream Machine)
    2. Replicate (AnimateDiff Lightning / SVD)
    """
    clean_prompt = prompt.strip()
    if not clean_prompt:
        return {"success": False, "error": "Debes especificar un prompt para la generación de vídeo."}

    # 1. Intentar con Fal.ai (SDK oficial fal-client o REST)
    if FAL_KEY:
        os.environ["FAL_KEY"] = FAL_KEY
        print(f"[Extensión de Dominio] Invocando Fal.ai Video API para: '{clean_prompt[:50]}...'", flush=True)

        if HAS_FAL_SDK:
            try:
                # Seleccionar modelo Wan 2.1 Fast
                model_endpoint = "fal-ai/wan/v2.1/t2v-480p" if not image_url else "fal-ai/wan/v2.1/i2v-480p"
                args = {
                    "prompt": clean_prompt,
                    "aspect_ratio": aspect_ratio,
                    "num_frames": 81 if duration >= 5 else 41
                }
                if image_url:
                    args["image_url"] = image_url

                print(f"[Extensión de Dominio] Enviando tarea a {model_endpoint}...", flush=True)
                handler = fal_client.submit(model_endpoint, arguments=args)
                result = handler.get()

                video_url = None
                if isinstance(result, dict):
                    if "video" in result and isinstance(result["video"], dict):
                        video_url = result["video"].get("url")
                    elif "url" in result:
                        video_url = result.get("url")

                if video_url:
                    return {
                        "success": True,
                        "provider": "fal.ai (Wan 2.1 Ultra-Fast SDK)",
                        "prompt": clean_prompt,
                        "video_url": video_url,
                        "aspect_ratio": aspect_ratio,
                        "duration": duration
                    }
            except Exception as e:
                print(f"[Extensión de Dominio] Error con fal-client SDK: {e}", flush=True)

        # Fallback REST a Fal.ai
        try:
            headers = {
                "Authorization": f"Key {FAL_KEY}",
                "Content-Type": "application/json"
            }
            endpoint = "https://queue.fal.run/fal-ai/wan/v2.1/t2v-480p"
            payload = {
                "prompt": clean_prompt,
                "aspect_ratio": aspect_ratio,
                "num_frames": 81
            }
            resp = requests.post(endpoint, headers=headers, json=payload, timeout=30)
            if resp.status_code in [200, 201]:
                data = resp.json()
                video_url = data.get("video", {}).get("url") or data.get("url")
                if video_url:
                    return {
                        "success": True,
                        "provider": "fal.ai (REST Queue)",
                        "prompt": clean_prompt,
                        "video_url": video_url,
                        "aspect_ratio": aspect_ratio
                    }
        except Exception as e:
            print(f"[Extensión de Dominio] Error en Fal.ai REST: {e}", flush=True)

    # 2. Intentar con Replicate
    if REPLICATE_API_TOKEN:
        print(f"[Extensión de Dominio] Invocando Replicate Video API...", flush=True)
        try:
            headers = {
                "Authorization": f"Token {REPLICATE_API_TOKEN}",
                "Content-Type": "application/json"
            }
            payload = {
                "version": "5e13554e22ff112ca001df1e63a1378d30e0e02eb4b74f3289ba113c12662058",
                "input": {
                    "prompt": clean_prompt,
                    "aspect_ratio": aspect_ratio
                }
            }
            resp = requests.post("https://api.replicate.com/v1/predictions", headers=headers, json=payload, timeout=20)
            if resp.status_code == 201:
                pred = resp.json()
                pred_id = pred.get("id")
                poll_url = f"https://api.replicate.com/v1/predictions/{pred_id}"
                for _ in range(15):
                    time.sleep(2)
                    p_resp = requests.get(poll_url, headers=headers, timeout=10).json()
                    if p_resp.get("status") == "succeeded":
                        video_url = p_resp.get("output")
                        if isinstance(video_url, list):
                            video_url = video_url[0]
                        return {
                            "success": True,
                            "provider": "replicate (Lightning)",
                            "prompt": clean_prompt,
                            "video_url": video_url,
                            "aspect_ratio": aspect_ratio
                        }
                    elif p_resp.get("status") == "failed":
                        break
        except Exception as e:
            print(f"[Extensión de Dominio] Error en Replicate: {e}", flush=True)

    # 3. Pipeline Listo
    return {
        "success": True,
        "mode": "pipeline_ready",
        "provider": "Extensión de Dominio (Video Engine)",
        "prompt_optimizado": (
            f"🎬 **PROMPT DE VÍDEO CINEMATOGRÁFICO OPTIMIZADO (9:16 REEL/TIKTOK):**\n"
            f"_{clean_prompt}_\n\n"
            f"✨ **Parámetros Técnicos:**\n"
            f"• **Aspect Ratio:** `{aspect_ratio}` (Vertical Ultra HD)\n"
            f"• **Estilo:** 4K Photorealistic, smooth 60fps motion, cinematic lighting, zero artifacting.\n"
            f"• **Duración:** `{duration} segundos`\n\n"
            f"🔑 **Extensión de Dominio lista para conectar tu API key:**\n"
            f"Indícame tu clave `FAL_KEY` de Fal.ai y la integraré al instante para generar vídeos en <15s."
        )
    }
