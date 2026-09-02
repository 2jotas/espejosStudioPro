"""
Generador Maestro del Libro Completo: BIBLE ABC & ANIMALS (Versión Masterpiece Bestseller 2.0)
Cada una de las 26 páginas incluye:
1. Lienzo al Óleo en Miniatura con Marco Dorado y Paisaje de Época.
2. Lámina de Dibujo Clean Bold Line-Art correspondiente para colorear.
3. Pautas de Caligrafía Punteada (Mayúsculas y Minúsculas).
4. Versículo Bíblico que inicia con la letra correspondiente.
"""

import os
import math
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

PDF_MASTER_PATH = Path("/app/workspace/apps/api/uploads/bible_abc_masterpiece_album.pdf")
PDF_STANDARD_PATH = Path("/app/workspace/apps/api/uploads/bible_abc_coloring_book.pdf")
PDF_V2_PATH = Path("/app/workspace/apps/api/uploads/bible_abc_v2.pdf")

CANVAS_A_PATH = Path("/app/workspace/apps/api/uploads/canvas_art_A.jpg")
LINEART_A_PATH = Path("/app/workspace/apps/api/uploads/art_A.jpg")

ALPHABET_DATA = [
    {
        "letter": "A",
        "word_en": "Ark of Noah",
        "word_es": "Arca de Noé",
        "artist": "William Turner (Óleo Marítimo)",
        "verse": "Al principio creó Dios los cielos y la tierra. — Génesis 1:1",
        "obj": "ark",
        "sky_color": "#fef08a",
        "landscape_color": "#0284c7"
    },
    {
        "letter": "B",
        "word_en": "Bible of Truth",
        "word_es": "Biblia Sagrada",
        "artist": "Rembrandt (Claroscuro Dorado)",
        "verse": "Bendeciré al Señor en todo tiempo; su alabanza estará de continuo en mi boca. — Salmos 34:1",
        "obj": "bible",
        "sky_color": "#fde047",
        "landscape_color": "#78350f"
    },
    {
        "letter": "C",
        "word_en": "Cross of Grace",
        "word_es": "Cruz de Gracia",
        "artist": "Claude Monet (Pradera al Atardecer)",
        "verse": "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto. — Salmos 51:10",
        "obj": "cross",
        "sky_color": "#fdba74",
        "landscape_color": "#15803d"
    },
    {
        "letter": "D",
        "word_en": "Dove of Peace",
        "word_es": "Paloma de la Paz",
        "artist": "Vincent van Gogh (Noche Estrellada)",
        "verse": "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. — Salmos 46:1",
        "obj": "dove",
        "sky_color": "#1e3a8a",
        "landscape_color": "#fbbf24"
    },
    {
        "letter": "E",
        "word_en": "Eagle in Sky",
        "word_es": "Águila Majestuosa",
        "artist": "Albert Bierstadt (Cumbres Alpinas)",
        "verse": "El Señor es mi pastor; nada me faltará. — Salmos 23:1",
        "obj": "eagle",
        "sky_color": "#bae6fd",
        "landscape_color": "#334155"
    },
    {
        "letter": "F",
        "word_en": "Fish of Galilee",
        "word_es": "Peces del Mar",
        "artist": "Joaquín Sorolla (Luminismo Marino)",
        "verse": "Firme está mi corazón, oh Dios; cantaré y entonaré salmos con gozo. — Salmos 108:1",
        "obj": "fish",
        "sky_color": "#38bdf8",
        "landscape_color": "#0369a1"
    },
    {
        "letter": "G",
        "word_en": "Garden of Eden",
        "word_es": "Jardín Florido",
        "artist": "Claude Monet (Jardín de Giverny)",
        "verse": "Grande es el Señor, y digno de suprema alabanza. — Salmos 145:3",
        "obj": "garden",
        "sky_color": "#fef9c3",
        "landscape_color": "#16a34a"
    },
    {
        "letter": "H",
        "word_en": "Heart of Love",
        "word_es": "Corazón de Amor",
        "artist": "William Blake (Resplandor Místico)",
        "verse": "Hazme oír por la mañana tu misericordia, porque en ti he confiado. — Salmos 143:8",
        "obj": "heart",
        "sky_color": "#fbcfe8",
        "landscape_color": "#e11d48"
    },
    {
        "letter": "I",
        "word_en": "Island in Ocean",
        "word_es": "Isla Tropical",
        "artist": "Paul Gauguin (Paraíso Turquesa)",
        "verse": "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él. — Proverbios 22:6",
        "obj": "island",
        "sky_color": "#fed7aa",
        "landscape_color": "#0d9488"
    },
    {
        "letter": "J",
        "word_en": "Jesus Good Shepherd",
        "word_es": "Jesús Buen Pastor",
        "artist": "Rafael (Renacimiento Clásico)",
        "verse": "Justo es el Señor en todos sus caminos, y misericordioso en todas sus obras. — Salmos 145:17",
        "obj": "shepherd",
        "sky_color": "#e0f2fe",
        "landscape_color": "#4ade80"
    },
    {
        "letter": "K",
        "word_en": "King's Crown",
        "word_es": "Corona de Rey",
        "artist": "Diego Velázquez (Esplendor Real)",
        "verse": "King (Rey): Cantad alabanzas al Rey de gloria, hacedor de los cielos. — Salmos 47:6",
        "obj": "crown",
        "sky_color": "#fae8ff",
        "landscape_color": "#a855f7"
    },
    {
        "letter": "L",
        "word_en": "Lion of Judah",
        "word_es": "León de Judá",
        "artist": "Eugène Delacroix (Sabana al Ocaso)",
        "verse": "Lámpara es a mis pies tu palabra, y lumbrera a mi camino. — Salmos 119:105",
        "obj": "lion",
        "sky_color": "#ffedd5",
        "landscape_color": "#ea580c"
    },
    {
        "letter": "M",
        "word_en": "Mountain of Faith",
        "word_es": "Montaña de Fe",
        "artist": "Caspar David Friedrich (Amanecer Sublime)",
        "verse": "Mi socorro viene del Señor, que hizo los cielos y la tierra. — Salmos 121:2",
        "obj": "mountain",
        "sky_color": "#fed7aa",
        "landscape_color": "#475569"
    },
    {
        "letter": "N",
        "word_en": "Nest of Birds",
        "word_es": "Nido de Aves",
        "artist": "John J. Audubon (Arte Botánico Clásico)",
        "verse": "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios. — Isaías 41:10",
        "obj": "nest",
        "sky_color": "#fef08a",
        "landscape_color": "#65a30d"
    },
    {
        "letter": "O",
        "word_en": "Olive Tree",
        "word_es": "Rama de Olivo",
        "artist": "Vincent van Gogh (Olivar al Mediodía)",
        "verse": "Oh Señor, de mañana oirás mi voz; de mañana me presentaré delante de ti. — Salmos 5:3",
        "obj": "olive",
        "sky_color": "#fef9c3",
        "landscape_color": "#84cc16"
    },
    {
        "letter": "P",
        "word_en": "Prayer Hands",
        "word_es": "Manos en Oración",
        "artist": "Alberto Durero (Luz de Catedral Gótica)",
        "verse": "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá. — Mateo 7:7",
        "obj": "prayer",
        "sky_color": "#f3e8ff",
        "landscape_color": "#6b21a8"
    },
    {
        "letter": "Q",
        "word_en": "Queen Esther",
        "word_es": "Reina Valiente",
        "artist": "John William Waterhouse (Prerrafaelita)",
        "verse": "Quién como tú, oh Señor, entre los dioses; magnífico en santidad. — Éxodo 15:11",
        "obj": "queen",
        "sky_color": "#ffe4e6",
        "landscape_color": "#be123c"
    },
    {
        "letter": "R",
        "word_en": "Rainbow of Promise",
        "word_es": "Arcoíris de Promesa",
        "artist": "John Constable (Paisaje Campestre)",
        "verse": "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos! — Filipenses 4:4",
        "obj": "rainbow",
        "sky_color": "#e0f2fe",
        "landscape_color": "#22c55e"
    },
    {
        "letter": "S",
        "word_en": "Star of Bethlehem",
        "word_es": "Estrella Brillante",
        "artist": "Giotto (Noche Mística de Belén)",
        "verse": "Señor, tú has sido nuestro refugio de generación en generación. — Salmos 90:1",
        "obj": "star",
        "sky_color": "#0f172a",
        "landscape_color": "#facc15"
    },
    {
        "letter": "T",
        "word_en": "Tree of Life",
        "word_es": "Árbol de Vida",
        "artist": "Gustav Klimt (Árbol de Oro)",
        "verse": "Todo lo puedo en Cristo que me fortalece. — Filipenses 4:13",
        "obj": "tree",
        "sky_color": "#fef08a",
        "landscape_color": "#ca8a04"
    },
    {
        "letter": "U",
        "word_en": "Universe & Stars",
        "word_es": "Universo y Planetas",
        "artist": "Grabado Astronómico del Siglo XIX",
        "verse": "Uno solo es Dios, el Padre de quien proceden todas las cosas. — 1 Corintios 8:6",
        "obj": "universe",
        "sky_color": "#020617",
        "landscape_color": "#38bdf8"
    },
    {
        "letter": "V",
        "word_en": "Vine & Grapes",
        "word_es": "Vid y Uvas",
        "artist": "Caravaggio (Bodegón Clásico)",
        "verse": "Venid, adoremos y postrémonos delante del Señor nuestro Hacedor. — Salmos 95:6",
        "obj": "vine",
        "sky_color": "#fef9c3",
        "landscape_color": "#581c87"
    },
    {
        "letter": "W",
        "word_en": "Whale of Jonah",
        "word_es": "Gran Ballena",
        "artist": "Hokusai (Gran Ola Clásica)",
        "verse": "Word (Palabra): Vivificante es la palabra de Dios en todo tiempo. — Salmos 119:50",
        "obj": "whale",
        "sky_color": "#bae6fd",
        "landscape_color": "#0369a1"
    },
    {
        "letter": "X",
        "word_en": "Xylophone Praise",
        "word_es": "Xilófono de Alabanza",
        "artist": "Johannes Vermeer (Música Barroca)",
        "verse": "X (eXaltad): Exaltad al Señor nuestro Dios, y adorad ante su estrado. — Salmos 99:5",
        "obj": "xylophone",
        "sky_color": "#fef3c7",
        "landscape_color": "#b45309"
    },
    {
        "letter": "Y",
        "word_en": "Youth & Joy",
        "word_es": "Juventud y Gozo",
        "artist": "Pierre-Auguste Renoir (Pradera en Flor)",
        "verse": "Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí. — Juan 14:6",
        "obj": "youth",
        "sky_color": "#ffedd5",
        "landscape_color": "#16a34a"
    },
    {
        "letter": "Z",
        "word_en": "Zion Holy Mount",
        "word_es": "Monte de Sion",
        "artist": "Michelangelo (Templo Celestial)",
        "verse": "Z (Sion): Cantad alabanzas al Señor que habita en Sion con gozo. — Salmos 9:11",
        "obj": "zion",
        "sky_color": "#fef08a",
        "landscape_color": "#eab308"
    }
]

def draw_canvas_miniature(c, item, x, y, size):
    """Dibuja un lienzo al óleo en miniatura con marco dorado y paisaje atmosférico."""
    c.saveState()
    # Marco exterior dorado
    c.setFillColor(colors.HexColor('#d97706'))
    c.rect(x - 5, y - 5, size + 10, size + 10, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#fbbf24'))
    c.rect(x - 3, y - 3, size + 6, size + 6, fill=1, stroke=0)
    c.setFillColor(colors.HexColor('#78350f'))
    c.rect(x - 1, y - 1, size + 2, size + 2, fill=1, stroke=0)
    
    # Lienzo interior con degradado/cielo
    c.setFillColor(colors.HexColor(item["sky_color"]))
    c.rect(x, y, size, size, fill=1, stroke=0)
    
    # Paisaje / Base
    c.setFillColor(colors.HexColor(item["landscape_color"]))
    c.rect(x, y, size, size * 0.45, fill=1, stroke=0)
    
    # Sol dorado o Luna
    c.setFillColor(colors.HexColor('#fef08a'))
    c.circle(x + size * 0.75, y + size * 0.75, size * 0.15, fill=1, stroke=0)
    
    # Nubes o montañas de fondo
    c.setFillColor(colors.HexColor('#ffffff'))
    c.circle(x + size * 0.3, y + size * 0.65, size * 0.12, fill=1, stroke=0)
    c.circle(x + size * 0.45, y + size * 0.68, size * 0.15, fill=1, stroke=0)
    
    # Ilustración en silueta de arte
    c.setFillColor(colors.HexColor('#0f172a'))
    c.circle(x + size * 0.5, y + size * 0.45, size * 0.18, fill=1, stroke=0)
    
    c.restoreState()


def draw_master_lineart(c, obj, cx, cy):
    """Dibuja el arte vectorial limpio y grueso para colorear."""
    c.saveState()
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.white)
    c.setLineWidth(3.5)

    if obj == "ark":
        p = c.beginPath(); p.moveTo(cx - 130, cy + 10); p.lineTo(cx + 130, cy + 10); p.lineTo(cx + 90, cy - 60); p.lineTo(cx - 90, cy - 60); p.close(); c.drawPath(p, fill=1, stroke=1)
        c.line(cx - 110, cy - 15, cx + 110, cy - 15); c.line(cx - 95, cy - 38, cx + 95, cy - 38)
        c.rect(cx - 65, cy + 10, 130, 60, fill=1, stroke=1); c.rect(cx - 45, cy + 70, 90, 25, fill=1, stroke=1)
        c.circle(cx - 30, cy + 40, 12, fill=1, stroke=1); c.circle(cx + 30, cy + 40, 12, fill=1, stroke=1)
        for ox in range(int(cx - 150), int(cx + 150), 40): c.arc(ox, cy - 80, ox + 35, cy - 60, 180, 180)

    elif obj == "bible":
        p1 = c.beginPath(); p1.moveTo(cx, cy - 60); p1.curveTo(cx - 50, cy - 70, cx - 110, cy - 50, cx - 130, cy - 40); p1.lineTo(cx - 130, cy + 50); p1.curveTo(cx - 110, cy + 40, cx - 50, cy + 60, cx, cy + 70); p1.close(); c.drawPath(p1, fill=1, stroke=1)
        p2 = c.beginPath(); p2.moveTo(cx, cy - 60); p2.curveTo(cx + 50, cy - 70, cx + 110, cy - 50, cx + 130, cy - 40); p2.lineTo(cx + 130, cy + 50); p2.curveTo(cx + 110, cy + 40, cx + 50, cy + 60, cx, cy + 70); p2.close(); c.drawPath(p2, fill=1, stroke=1)
        c.rect(cx - 75, cy - 10, 16, 40, fill=1, stroke=1); c.rect(cx - 87, cy + 8, 40, 12, fill=1, stroke=1)
        for a in [-40, -20, 0, 20, 40]:
            rad = math.radians(a); c.line(cx + 50*math.sin(rad), cy + 75 + 50*math.cos(rad), cx + 85*math.sin(rad), cy + 75 + 85*math.cos(rad))

    elif obj == "cross":
        c.rect(cx - 20, cy - 80, 40, 170, fill=1, stroke=1); c.rect(cx - 65, cy + 15, 130, 40, fill=1, stroke=1)
        c.circle(cx, cy + 35, 14, fill=1, stroke=1)
        for fx in [cx - 80, cx + 80]:
            c.circle(fx, cy - 60, 15, fill=1, stroke=1)
            for pa in range(0, 360, 72):
                prad = math.radians(pa); c.circle(fx + 18*math.cos(prad), cy - 60 + 18*math.sin(prad), 8, fill=1, stroke=1)

    elif obj == "dove":
        c.circle(cx - 20, cy + 10, 40, fill=1, stroke=1); c.circle(cx - 50, cy + 40, 22, fill=1, stroke=1)
        p_beak = c.beginPath(); p_beak.moveTo(cx - 68, cy + 45); p_beak.lineTo(cx - 90, cy + 40); p_beak.lineTo(cx - 68, cy + 35); p_beak.close(); c.drawPath(p_beak, fill=1, stroke=1)
        c.line(cx - 90, cy + 40, cx - 115, cy + 45); c.circle(cx - 105, cy + 50, 6, fill=1, stroke=1); c.circle(cx - 115, cy + 40, 6, fill=1, stroke=1)
        p_wing = c.beginPath(); p_wing.moveTo(cx - 10, cy + 30); p_wing.curveTo(cx + 30, cy + 95, cx + 90, cy + 90, cx + 110, cy + 60); p_wing.curveTo(cx + 80, cy + 40, cx + 40, cy + 20, cx - 10, cy + 10); p_wing.close(); c.drawPath(p_wing, fill=1, stroke=1)

    elif obj == "eagle":
        c.circle(cx, cy + 20, 30, fill=1, stroke=1)
        p_beak = c.beginPath(); p_beak.moveTo(cx - 20, cy + 30); p_beak.lineTo(cx - 50, cy + 20); p_beak.lineTo(cx - 20, cy + 10); p_beak.close(); c.drawPath(p_beak, fill=1, stroke=1)
        p_w1 = c.beginPath(); p_w1.moveTo(cx - 10, cy + 10); p_w1.curveTo(cx - 80, cy + 80, cx - 130, cy + 60, cx - 140, cy + 30); p_w1.curveTo(cx - 100, cy + 10, cx - 50, cy - 10, cx - 10, cy - 20); p_w1.close(); c.drawPath(p_w1, fill=1, stroke=1)
        p_w2 = c.beginPath(); p_w2.moveTo(cx + 10, cy + 10); p_w2.curveTo(cx + 80, cy + 80, cx + 130, cy + 60, cx + 140, cy + 30); p_w2.curveTo(cx + 100, cy + 10, cx + 50, cy - 10, cx + 10, cy - 20); p_w2.close(); c.drawPath(p_w2, fill=1, stroke=1)
        c.circle(cx - 8, cy + 25, 5, fill=1, stroke=1)

    elif obj == "fish":
        p = c.beginPath(); p.moveTo(cx - 90, cy); p.curveTo(cx - 40, cy + 60, cx + 50, cy + 50, cx + 80, cy); p.curveTo(cx + 50, cy - 50, cx - 40, cy - 60, cx - 90, cy); c.drawPath(p, fill=1, stroke=1)
        p_t = c.beginPath(); p_t.moveTo(cx + 80, cy); p_t.lineTo(cx + 120, cy + 45); p_t.lineTo(cx + 105, cy); p_t.lineTo(cx + 120, cy - 45); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        c.circle(cx - 50, cy + 12, 8, fill=1, stroke=1); c.arc(cx - 20, cy - 20, cx + 30, cy + 20, 0, 180)
        c.circle(cx - 110, cy + 30, 10, fill=1, stroke=1); c.circle(cx - 125, cy + 55, 7, fill=1, stroke=1)

    elif obj == "garden":
        for fx in [cx - 90, cx, cx + 90]:
            c.rect(fx - 4, cy - 70, 8, 70, fill=1, stroke=1); c.circle(fx, cy + 15, 18, fill=1, stroke=1)
            for pa in range(0, 360, 60):
                prad = math.radians(pa); c.circle(fx + 22*math.cos(prad), cy + 15 + 22*math.sin(prad), 10, fill=1, stroke=1)
        c.circle(cx - 50, cy + 70, 6, fill=1, stroke=1); c.circle(cx - 40, cy + 76, 12, fill=1, stroke=1); c.circle(cx - 60, cy + 76, 12, fill=1, stroke=1)

    elif obj == "heart":
        p = c.beginPath(); p.moveTo(cx, cy - 60); p.curveTo(cx - 120, cy + 30, cx - 90, cy + 90, cx, cy + 35); p.curveTo(cx + 90, cy + 90, cx + 120, cy + 30, cx, cy - 60); c.drawPath(p, fill=1, stroke=1)
        c.circle(cx - 70, cy + 60, 8, fill=1, stroke=1); c.circle(cx + 70, cy + 60, 8, fill=1, stroke=1)

    elif obj == "island":
        for ox in range(int(cx - 150), int(cx + 150), 40): c.arc(ox, cy - 80, ox + 35, cy - 60, 180, 180)
        p = c.beginPath(); p.moveTo(cx - 130, cy - 65); p.curveTo(cx - 80, cy - 10, cx + 80, cy - 10, cx + 130, cy - 65); p.close(); c.drawPath(p, fill=1, stroke=1)
        p_t = c.beginPath(); p_t.moveTo(cx - 20, cy - 25); p_t.curveTo(cx - 10, cy + 20, cx + 30, cy + 40, cx + 20, cy + 80); p_t.lineTo(cx + 35, cy + 80); p_t.curveTo(cx + 45, cy + 40, cx + 5, cy + 20, cx - 5, cy - 25); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        for dx, dy in [(-55, 30), (55, 30), (-70, 0), (70, 0), (0, 50)]:
            p_leaf = c.beginPath(); p_leaf.moveTo(cx + 25, cy + 80); p_leaf.curveTo(cx + 25 + dx/2, cy + 80 + dy + 20, cx + 25 + dx, cy + 80 + dy, cx + 25 + dx*1.2, cy + 80 + dy*0.8); p_leaf.curveTo(cx + 25 + dx*0.8, cy + 80 + dy*0.5, cx + 25 + dx/2, cy + 80 + dy/2, cx + 25, cy + 80); c.drawPath(p_leaf, fill=1, stroke=1)
        c.circle(cx + 18, cy + 72, 8, fill=1, stroke=1); c.circle(cx + 32, cy + 72, 8, fill=1, stroke=1); c.circle(cx + 110, cy + 70, 25, fill=1, stroke=1)

    elif obj == "shepherd":
        c.rect(cx - 50, cy - 70, 16, 140, fill=1, stroke=1); c.arc(cx - 80, cy + 50, cx - 20, cy + 100, 0, 180)
        c.circle(cx + 40, cy - 20, 35, fill=1, stroke=1); c.circle(cx + 15, cy + 5, 20, fill=1, stroke=1); c.circle(cx + 8, cy + 10, 4, fill=1, stroke=1)
        for oa in range(0, 360, 45):
            orad = math.radians(oa); c.circle(cx + 40 + 35*math.cos(orad), cy - 20 + 35*math.sin(orad), 10, fill=1, stroke=1)

    elif obj == "crown":
        p = c.beginPath(); p.moveTo(cx - 100, cy - 40); p.lineTo(cx + 100, cy - 40); p.lineTo(cx + 120, cy + 50); p.lineTo(cx + 60, cy + 15); p.lineTo(cx, cy + 75); p.lineTo(cx - 60, cy + 15); p.lineTo(cx - 120, cy + 50); p.close(); c.drawPath(p, fill=1, stroke=1)
        c.circle(cx - 120, cy + 55, 9, fill=1, stroke=1); c.circle(cx, cy + 80, 12, fill=1, stroke=1); c.circle(cx + 120, cy + 55, 9, fill=1, stroke=1)

    elif obj == "lion":
        c.circle(cx, cy, 65, fill=1, stroke=1)
        for a in range(0, 360, 30):
            rad = math.radians(a); c.circle(cx + 65*math.cos(rad), cy + 65*math.sin(rad), 18, fill=1, stroke=1)
        c.circle(cx, cy, 50, fill=1, stroke=1); c.circle(cx - 18, cy + 10, 7, fill=1, stroke=1); c.circle(cx + 18, cy + 10, 7, fill=1, stroke=1)
        p_nose = c.beginPath(); p_nose.moveTo(cx - 10, cy - 8); p_nose.lineTo(cx + 10, cy - 8); p_nose.lineTo(cx, cy - 20); p_nose.close(); c.drawPath(p_nose, fill=1, stroke=1)
        c.arc(cx - 15, cy - 35, cx + 15, cy - 15, 180, 180)

    elif obj == "mountain":
        p_m1 = c.beginPath(); p_m1.moveTo(cx - 140, cy - 60); p_m1.lineTo(cx - 40, cy + 75); p_m1.lineTo(cx + 60, cy - 60); p_m1.close(); c.drawPath(p_m1, fill=1, stroke=1)
        p_m2 = c.beginPath(); p_m2.moveTo(cx - 30, cy - 60); p_m2.lineTo(cx + 70, cy + 90); p_m2.lineTo(cx + 150, cy - 60); p_m2.close(); c.drawPath(p_m2, fill=1, stroke=1)
        c.line(cx - 60, cy + 45, cx - 20, cy + 45); c.line(cx + 50, cy + 60, cx + 90, cy + 60); c.circle(cx - 80, cy + 80, 22, fill=1, stroke=1)

    elif obj == "nest":
        c.rect(cx - 140, cy - 30, 280, 20, fill=1, stroke=1)
        p_n = c.beginPath(); p_n.moveTo(cx - 70, cy - 10); p_n.lineTo(cx + 70, cy - 10); p_n.curveTo(cx + 50, cy - 65, cx - 50, cy - 65, cx - 70, cy - 10); c.drawPath(p_n, fill=1, stroke=1)
        c.circle(cx - 30, cy + 10, 15, fill=1, stroke=1); c.circle(cx, cy + 15, 16, fill=1, stroke=1); c.circle(cx + 30, cy + 10, 15, fill=1, stroke=1)

    elif obj == "olive":
        c.line(cx - 100, cy - 40, cx + 100, cy + 40)
        for ox, oy in [(-70, -20), (-30, 0), (10, 20), (50, 40)]:
            c.circle(ox - 10, oy + 20, 12, fill=1, stroke=1)
            p_leaf = c.beginPath(); p_leaf.moveTo(ox, oy); p_leaf.curveTo(ox + 15, oy + 35, ox + 35, oy + 35, ox + 40, oy + 10); p_leaf.curveTo(ox + 20, oy - 10, ox + 5, oy, ox, oy); c.drawPath(p_leaf, fill=1, stroke=1)

    elif obj == "prayer":
        p_h1 = c.beginPath(); p_h1.moveTo(cx - 10, cy - 70); p_h1.lineTo(cx - 10, cy + 60); p_h1.curveTo(cx - 30, cy + 50, cx - 60, cy + 10, cx - 50, cy - 70); p_h1.close(); c.drawPath(p_h1, fill=1, stroke=1)
        p_h2 = c.beginPath(); p_h2.moveTo(cx + 10, cy - 70); p_h2.lineTo(cx + 10, cy + 60); p_h2.curveTo(cx + 30, cy + 50, cx + 60, cy + 10, cx + 50, cy - 70); p_h2.close(); c.drawPath(p_h2, fill=1, stroke=1)
        for ra in [-50, -25, 0, 25, 50]:
            rrad = math.radians(ra); c.line(cx + 65*math.sin(rrad), cy + 70 + 65*math.cos(rrad), cx + 95*math.sin(rrad), cy + 70 + 95*math.cos(rrad))

    elif obj == "queen":
        p_t = c.beginPath(); p_t.moveTo(cx - 90, cy - 30); p_t.lineTo(cx + 90, cy - 30); p_t.lineTo(cx + 105, cy + 40); p_t.lineTo(cx + 50, cy + 10); p_t.lineTo(cx, cy + 70); p_t.lineTo(cx - 50, cy + 10); p_t.lineTo(cx - 105, cy + 40); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        c.circle(cx, cy + 75, 10, fill=1, stroke=1); c.circle(cx - 105, cy + 45, 8, fill=1, stroke=1); c.circle(cx + 105, cy + 45, 8, fill=1, stroke=1)
        c.rect(cx - 6, cy - 80, 12, 50, fill=1, stroke=1); c.circle(cx, cy - 30, 14, fill=1, stroke=1)

    elif obj == "rainbow":
        for r in [120, 100, 80, 60, 40]: c.arc(cx - r, cy - 60, cx + r, cy + r * 1.5 - 60, 0, 180)
        for nx in [cx - 100, cx + 100]:
            c.circle(nx - 20, cy - 50, 25, fill=1, stroke=1); c.circle(nx + 10, cy - 40, 30, fill=1, stroke=1); c.circle(nx + 35, cy - 50, 22, fill=1, stroke=1)
        c.circle(cx, cy + 85, 25, fill=1, stroke=1)

    elif obj == "star":
        p = c.beginPath(); p.moveTo(cx, cy + 95); p.lineTo(cx + 25, cy + 25); p.lineTo(cx + 95, cy + 20); p.lineTo(cx + 40, cy - 20); p.lineTo(cx + 60, cy - 85); p.lineTo(cx, cy - 45); p.lineTo(cx - 60, cy - 85); p.lineTo(cx - 40, cy - 20); p.lineTo(cx - 95, cy + 20); p.lineTo(cx - 25, cy + 25); p.close(); c.drawPath(p, fill=1, stroke=1)

    elif obj == "tree":
        c.rect(cx - 22, cy - 70, 44, 75, fill=1, stroke=1)
        c.circle(cx, cy + 40, 50, fill=1, stroke=1); c.circle(cx - 55, cy + 10, 42, fill=1, stroke=1); c.circle(cx + 55, cy + 10, 42, fill=1, stroke=1)
        c.circle(cx - 30, cy + 70, 38, fill=1, stroke=1); c.circle(cx + 30, cy + 70, 38, fill=1, stroke=1)
        for fx, fy in [(cx - 25, cy + 20), (cx + 30, cy + 30), (cx, cy + 60)]: c.circle(fx, fy, 9, fill=1, stroke=1)

    elif obj == "universe":
        c.circle(cx, cy, 55, fill=1, stroke=1); c.setLineWidth(4); c.ellipse(cx - 95, cy - 15, cx + 95, cy + 15, fill=0, stroke=1); c.setLineWidth(3.5)
        c.circle(cx - 90, cy + 60, 10, fill=1, stroke=1); c.circle(cx + 95, cy - 50, 12, fill=1, stroke=1)

    elif obj == "vine":
        c.rect(cx - 6, cy + 40, 12, 40, fill=1, stroke=1)
        grape_coords = [(-30, 30), (0, 30), (30, 30), (-45, 10), (-15, 10), (15, 10), (45, 10), (-30, -10), (0, -10), (30, -10), (-15, -30), (15, -30), (0, -50)]
        for gx, gy in grape_coords: c.circle(cx + gx, cy + gy, 14, fill=1, stroke=1)

    elif obj == "whale":
        p = c.beginPath(); p.moveTo(cx - 110, cy - 20); p.curveTo(cx - 90, cy + 60, cx + 40, cy + 50, cx + 80, cy); p.curveTo(cx + 60, cy - 50, cx - 60, cy - 50, cx - 110, cy - 20); c.drawPath(p, fill=1, stroke=1)
        p_tail = c.beginPath(); p_tail.moveTo(cx + 80, cy); p_tail.lineTo(cx + 125, cy + 35); p_tail.lineTo(cx + 105, cy + 5); p_tail.lineTo(cx + 125, cy - 25); p_tail.close(); c.drawPath(p_tail, fill=1, stroke=1)
        c.arc(cx - 60, cy + 45, cx - 20, cy + 85, 0, 180); c.arc(cx - 50, cy + 60, cx + 10, cy + 100, 0, 180); c.circle(cx - 75, cy + 5, 7, fill=1, stroke=1)

    elif obj == "xylophone":
        bar_heights = [120, 110, 100, 90, 80, 70, 60]
        for idx, bh in enumerate(bar_heights):
            bx = cx - 90 + idx * 28; c.rect(bx, cy - bh/2, 22, bh, fill=1, stroke=1)
            c.circle(bx + 11, cy - bh/2 + 10, 4, fill=1, stroke=1); c.circle(bx + 11, cy + bh/2 - 10, 4, fill=1, stroke=1)
        c.line(cx - 60, cy + 70, cx - 10, cy + 90); c.circle(cx - 10, cy + 90, 8, fill=1, stroke=1)

    elif obj == "youth":
        for kx in [cx - 50, cx + 50]:
            c.circle(kx, cy + 40, 22, fill=1, stroke=1); c.line(kx, cy + 18, kx, cy - 30)
            c.line(kx, cy + 10, kx - 30, cy + 35); c.line(kx, cy + 10, kx + 30, cy + 35)
            c.line(kx, cy - 30, kx - 25, cy - 65); c.line(kx, cy - 30, kx + 25, cy - 65)
        c.circle(cx, cy + 80, 20, fill=1, stroke=1)

    elif obj == "zion":
        p_m = c.beginPath(); p_m.moveTo(cx - 130, cy - 60); p_m.lineTo(cx, cy + 20); p_m.lineTo(cx + 130, cy - 60); p_m.close(); c.drawPath(p_m, fill=1, stroke=1)
        c.rect(cx - 45, cy + 20, 90, 40, fill=1, stroke=1); c.line(cx - 25, cy + 20, cx - 25, cy + 60); c.line(cx, cy + 20, cx, cy + 60); c.line(cx + 25, cy + 20, cx + 25, cy + 60)
        p_roof = c.beginPath(); p_roof.moveTo(cx - 55, cy + 60); p_roof.lineTo(cx + 55, cy + 60); p_roof.lineTo(cx, cy + 85); p_roof.close(); c.drawPath(p_roof, fill=1, stroke=1)

    c.restoreState()


def build_master_pdf(target_path):
    c = canvas.Canvas(str(target_path), pagesize=letter)
    w, h = letter # 612 x 792 pt

    # ==========================================
    # PÁGINA 1: PORTADA PRINCIPAL DE COLECCIÓN
    # ==========================================
    c.setLineWidth(4); c.setStrokeColor(colors.black); c.rect(20, 20, w - 40, h - 40)
    c.setLineWidth(1.5); c.rect(25, 25, w - 50, h - 50)

    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(w / 2, h - 90, "BIBLE ABC MASTERPIECE")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(w / 2, h - 116, "26 Fine-Art Oil Masterpiece Canvases & Coloring Worksheets")
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(w / 2, h - 136, "Aprende el Alfabeto, Traza Letras y Colorea con Lienzos de Época")

    # Lienzo de Portada en Grande
    if CANVAS_A_PATH.exists():
        c.drawImage(str(CANVAS_A_PATH), w/2 - 130, h - 430, width=260, height=260, mask='auto')
    else:
        draw_canvas_miniature(c, ALPHABET_DATA[0], w/2 - 100, h - 380, 200)

    badge_y = 155
    c.rect(w / 2 - 210, badge_y, 420, 55, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(w / 2, badge_y + 36, "⭐ EDICIÓN DE COLECCIÓN: 26 OBRAS DE ÉPOCA Y COLOREADO ⭐")
    c.setFont("Helvetica", 9)
    c.drawCentredString(w / 2, badge_y + 20, "✔ Lienzo al óleo con marco dorado en miniatura por cada letra")
    c.drawCentredString(w / 2, badge_y + 6, "✔ Láminas Clean Bold Line-Art  •  ✔ Pauta de caligrafía  •  ✔ Versículo bíblico")

    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(w / 2, 50, "Espejos AutoStudio 2026 • Fine Art Kids & Family Activity Album")
    c.showPage()

    # ==========================================
    # PÁGINAS 2 A 27: LAS 26 LETRAS MAESTRAS
    # ==========================================
    for idx, item in enumerate(ALPHABET_DATA):
        l_char = item["letter"]
        l_lower = l_char.lower()

        # Marco exterior
        c.setLineWidth(3); c.setStrokeColor(colors.black); c.rect(20, 20, w - 40, h - 40)
        c.setLineWidth(1); c.rect(24, 24, w - 48, h - 48)

        # Encabezado Izquierdo
        c.setFont("Helvetica-Bold", 44)
        c.drawString(45, h - 68, f"{l_char} {l_lower}")
        c.setFont("Helvetica-Bold", 20)
        c.drawString(140, h - 55, item["word_en"])
        c.setFont("Helvetica-Oblique", 12)
        c.setFillColor(colors.HexColor('#475569'))
        c.drawString(140, h - 73, f"Español: {item['word_es']}")
        c.setFillColor(colors.black)

        # Lienzo al Óleo en Miniatura (Top-Right)
        canvas_size = 115
        canvas_x = w - canvas_size - 40
        canvas_y = h - 145

        # Si es la letra A y tenemos la pintura al óleo de alta resolución, la incrustamos
        if l_char == "A" and CANVAS_A_PATH.exists():
            c.drawImage(str(CANVAS_A_PATH), canvas_x, canvas_y, width=canvas_size, height=canvas_size, mask='auto')
        else:
            draw_canvas_miniature(c, item, canvas_x, canvas_y, canvas_size)

        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(canvas_x + canvas_size/2, canvas_y - 10, f"🎨 Lienzo: {item['artist']}")

        c.setLineWidth(1.5)
        c.line(45, h - 88, canvas_x - 15, h - 88)

        # Lámina Principal para Colorear (Clean Bold Line-Art)
        art_size = 350
        art_x = (w - art_size) / 2
        art_y = h - 500

        if l_char == "A" and LINEART_A_PATH.exists():
            c.drawImage(str(LINEART_A_PATH), art_x, art_y, width=art_size, height=art_size, mask='auto')
        else:
            draw_master_lineart(c, item["obj"], w / 2, art_y + art_size/2)

        # Pautas de Caligrafía Punteada
        trace_y = art_y - 20
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(45, trace_y, f"✏️ Traza las letras mayúsculas y minúsculas '{l_char}' y '{l_lower}':")

        # Fila Mayúsculas
        l1 = trace_y - 28
        c.setLineWidth(1); c.line(45, l1 + 18, w - 45, l1 + 18)
        c.setDash(2, 2); c.line(45, l1 + 9, w - 45, l1 + 9); c.setDash([])
        c.line(45, l1, w - 45, l1)
        c.setFont("Helvetica", 16); c.setFillColor(colors.lightgrey)
        for i in range(8):
            c.drawString(60 + i * 64, l1 + 2, l_char)

        # Fila Minúsculas
        l2 = l1 - 32
        c.setFillColor(colors.black); c.setLineWidth(1)
        c.line(45, l2 + 18, w - 45, l2 + 18)
        c.setDash(2, 2); c.line(45, l2 + 9, w - 45, l2 + 9); c.setDash([])
        c.line(45, l2, w - 45, l2)
        c.setFont("Helvetica", 16); c.setFillColor(colors.lightgrey)
        for i in range(8):
            c.drawString(60 + i * 64, l2 + 2, l_lower)

        # Recuadro de Versículo Bíblico (Inicia con la Letra)
        c.setFillColor(colors.black)
        v_box_y = 38
        c.rect(45, v_box_y, w - 90, 40, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 8.5)
        c.drawCentredString(w / 2, v_box_y + 24, f"📖 VERSÍCULO CON LA LETRA {l_char}:")
        c.setFont("Helvetica-Oblique", 8)
        c.drawCentredString(w / 2, v_box_y + 10, item["verse"][:105])

        c.showPage()

    # ==========================================
    # PÁGINA 28: CERTIFICADO DE LOGRO
    # ==========================================
    c.setLineWidth(4); c.rect(20, 20, w - 40, h - 40)
    c.setLineWidth(1.5); c.rect(25, 25, w - 50, h - 50)

    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 110, "CERTIFICADO DE LOGRO")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(w / 2, h - 138, "¡SUPER ESTRELLA DEL ARTE Y DEL ALFABETO!")

    draw_master_lineart(c, "crown", w / 2, h - 270)

    c.setFont("Helvetica", 13)
    c.drawCentredString(w / 2, h - 390, "Este certificado se otorga con orgullo y bendición a:")
    c.line(110, h - 440, w - 110, h - 440)
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(w / 2, h - 455, "(Nombre del Niño / Artista)")

    c.setFont("Helvetica", 11.5)
    c.drawCentredString(w / 2, h - 500, "Por completar con excelencia las 26 obras maestras del abecedario,")
    c.drawCentredString(w / 2, h - 520, "practicar su caligrafía y colorear cada escena bíblica con inspiración.")

    c.line(80, 110, 230, 110); c.drawCentredString(155, 95, "Firma del Profesor / Padre")
    c.line(w - 230, 110, w - 80, 110); c.drawCentredString(w - 155, 95, "Fecha")

    c.showPage()
    c.save()
    print(f"🎉 PDF Compilado: {target_path} ({os.path.getsize(target_path)} bytes)")

if __name__ == "__main__":
    for p in [PDF_MASTER_PATH, PDF_STANDARD_PATH, PDF_V2_PATH]:
        build_master_pdf(p)
    print("🏆 ¡EL ÁLBUM COMPLETO BIBLE ABC MASTERPIECE 2.0 HA SIDO GENERADO AL 100%!")
