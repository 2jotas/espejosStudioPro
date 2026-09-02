"""
Worker Autónomo Flux: Genera y actualiza las 26 obras del abecedario con FLUX.1 (Lienzos al Óleo + Line-Art).
"""

import os
import time
import urllib.parse
import urllib.request
from pathlib import Path
from PIL import Image

UPLOADS_DIR = Path("/app/workspace/apps/api/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

LETTERS = [
    {"letter": "A", "subject": "Noah's Ark boat on ocean waves with rainbow sky", "style": "William Turner oil painting"},
    {"letter": "B", "subject": "Holy open Bible on wooden table with warm candlelight and roses", "style": "Rembrandt baroque oil painting"},
    {"letter": "C", "subject": "Rustic wooden Cross on green hill with red poppies and sunset", "style": "Claude Monet impressionist oil painting"},
    {"letter": "D", "subject": "Pure white Dove of peace in flight with olive branch in starry night sky", "style": "Vincent van Gogh starry oil painting"},
    {"letter": "E", "subject": "Majestic bald eagle soaring over snowy mountain peaks at sunrise", "style": "Albert Bierstadt romantic landscape oil painting"},
    {"letter": "F", "subject": "Cute fish jumping out of sparkling blue ocean water with sun", "style": "Joaquin Sorolla luminist oil painting"},
    {"letter": "G", "subject": "Lush garden of Eden with colorful blooming flowers and butterflies", "style": "Claude Monet Giverny oil painting"},
    {"letter": "H", "subject": "Glowing sacred heart with radiant golden sunbeams and flowers", "style": "William Blake mystic oil painting"},
    {"letter": "I", "subject": "Tropical island with palm trees, coconuts, turquoise lagoon and sand", "style": "Paul Gauguin oil painting"},
    {"letter": "J", "subject": "Jesus the Good Shepherd holding a cute fluffy baby lamb in green meadow", "style": "Raphael renaissance oil painting"},
    {"letter": "K", "subject": "Royal golden king crown with jewels resting on red velvet cushion", "style": "Diego Velazquez royal oil painting"},
    {"letter": "L", "subject": "Majestic noble Lion of Judah with crown on savanna hill at golden sunset", "style": "Eugene Delacroix romantic oil painting"},
    {"letter": "M", "subject": "Majestic snowy mountain peak with golden dawn and pine trees", "style": "Caspar David Friedrich sublime oil painting"},
    {"letter": "N", "subject": "Bird nest with blue eggs on blooming cherry blossom branch", "style": "Botanical classical oil painting"},
    {"letter": "O", "subject": "Mighty olive tree branch with green leaves and ripe purple olives in sunlight", "style": "Vincent van Gogh olive grove oil painting"},
    {"letter": "P", "subject": "Hands in prayer illuminated by soft cathedral stained glass light", "style": "Albrecht Durer classical oil painting"},
    {"letter": "Q", "subject": "Queen Esther wearing royal crown and velvet robe in palace", "style": "John William Waterhouse pre-raphaelite oil painting"},
    {"letter": "R", "subject": "Vibrant glowing rainbow arching over lush green rolling countryside hills", "style": "John Constable landscape oil painting"},
    {"letter": "S", "subject": "Bright radiant smiling golden sun in clear blue sky with fluffy clouds", "style": "Joaquin Sorolla sunny oil painting"},
    {"letter": "T", "subject": "Magnificent Tree of Life with lush canopy and golden fruits in meadow", "style": "Gustav Klimt golden oil painting"},
    {"letter": "U", "subject": "Planet Saturn with rings, cosmos, galaxy nebula and bright stars", "style": "Classical 19th century celestial oil painting"},
    {"letter": "V", "subject": "Grapevine with lush green leaves and clusters of purple grapes in vineyard", "style": "Caravaggio still life oil painting"},
    {"letter": "W", "subject": "Giant friendly whale swimming in deep blue ocean with water spout", "style": "Hokusai maritime oil painting"},
    {"letter": "X", "subject": "Wooden xylophone musical instrument with mallets and colorful notes", "style": "Vermeer baroque oil painting"},
    {"letter": "Y", "subject": "Happy joyful children jumping in a sunny field of wildflowers", "style": "Pierre-Auguste Renoir impressionist oil painting"},
    {"letter": "Z", "subject": "Holy Mount Zion with glowing celestial golden temple on summit", "style": "Michelangelo divine oil painting"}
]

def fetch_image(prompt, target_path):
    encoded = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded}?width=512&height=512&model=flux&nologo=true"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
            if len(data) > 5000:
                target_path.write_bytes(data)
                return True
    except Exception as e:
        print(f"Error descargando {target_path.name}: {e}")
    return False

def run_flux_pipeline():
    print("🚀 Iniciando generación masiva con FLUX.1 para las 26 letras...")
    for item in LETTERS:
        l = item["letter"]
        canvas_path = UPLOADS_DIR / f"canvas_art_{l}.jpg"
        lineart_path = UPLOADS_DIR / f"lineart_{l}.jpg"

        # 1. Canvas Oil Painting (si no existe o es de las letras pendientes)
        if not canvas_path.exists() or canvas_path.stat().st_size < 100000:
            prompt_canvas = f"Classical oil painting on canvas with ornate golden frame, {item['subject']}, {item['style']}, museum quality miniature."
            print(f"[{l}] Generando Lienzo al Óleo con FLUX...")
            if fetch_image(prompt_canvas, canvas_path):
                print(f"✔ [{l}] Lienzo guardado: {canvas_path.name} ({canvas_path.stat().st_size} bytes)")
            time.sleep(1)

        # 2. Line-Art Coloring Page
        if not lineart_path.exists() or lineart_path.stat().st_size < 100000:
            prompt_line = f"Professional children coloring book page, {item['subject']}, cute friendly style, thick bold clean black outlines, pure white background, no color, no shading, high contrast vector art for kids."
            print(f"[{l}] Generando Lámina Line-Art con FLUX...")
            if fetch_image(prompt_line, lineart_path):
                print(f"✔ [{l}] Line-art guardado: {lineart_path.name} ({lineart_path.stat().st_size} bytes)")
            time.sleep(1)

    print("🏆 ¡TODAS LAS 26 OBRAS HAN SIDO PROCESADAS CON FLUX!")

if __name__ == "__main__":
    run_flux_pipeline()
