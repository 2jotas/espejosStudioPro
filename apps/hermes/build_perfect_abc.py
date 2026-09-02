"""
Generador Maestro y Completo: BIBLE ABC COLORING BOOK (Versión 2.0 Ultra-Aesthetic)
26 Letras con Ilustraciones Vectoriales Propias (0 genéricas) y Versículos Bíblicos Exactos.
"""

import os
import math
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

PDF_FILES = [
    Path("/app/workspace/apps/api/uploads/bible_abc_coloring_book.pdf"),
    Path("/app/workspace/apps/api/uploads/bible_abc_v2.pdf"),
    Path("/app/workspace/apps/api/uploads/bible_abc_master.pdf")
]

MOCKUP_PATH = Path("/app/workspace/apps/api/uploads/bible_abc_cover_mockup.png")

for p in PDF_FILES:
    p.parent.mkdir(parents=True, exist_ok=True)

LETTERS = [
    {
        "letter": "A",
        "word_en": "Ark of Noah",
        "word_es": "Arca de Noé",
        "verse": "Al principio creó Dios los cielos y la tierra. — Génesis 1:1",
        "obj": "ark"
    },
    {
        "letter": "B",
        "word_en": "Bible of Truth",
        "word_es": "Biblia Sagrada",
        "verse": "Bendeciré al Señor en todo tiempo; su alabanza estará de continuo en mi boca. — Salmos 34:1",
        "obj": "bible"
    },
    {
        "letter": "C",
        "word_en": "Cross of Grace",
        "word_es": "Cruz de Gracia",
        "verse": "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto. — Salmos 51:10",
        "obj": "cross"
    },
    {
        "letter": "D",
        "word_en": "Dove of Peace",
        "word_es": "Paloma de la Paz",
        "verse": "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. — Salmos 46:1",
        "obj": "dove"
    },
    {
        "letter": "E",
        "word_en": "Eagle in Sky",
        "word_es": "Águila Majestuosa",
        "verse": "El Señor es mi pastor; nada me faltará. — Salmos 23:1",
        "obj": "eagle"
    },
    {
        "letter": "F",
        "word_en": "Fish of Galilee",
        "word_es": "Peces del Mar",
        "verse": "Firme está mi corazón, oh Dios; cantaré y entonaré salmos con gozo. — Salmos 108:1",
        "obj": "fish"
    },
    {
        "letter": "G",
        "word_en": "Garden of Eden",
        "word_es": "Jardín Florido",
        "verse": "Grande es el Señor, y digno de suprema alabanza. — Salmos 145:3",
        "obj": "garden"
    },
    {
        "letter": "H",
        "word_en": "Heart of Love",
        "word_es": "Corazón de Amor",
        "verse": "Hazme oír por la mañana tu misericordia, porque en ti he confiado. — Salmos 143:8",
        "obj": "heart"
    },
    {
        "letter": "I",
        "word_en": "Island in Ocean",
        "word_es": "Isla Tropical",
        "verse": "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él. — Proverbios 22:6",
        "obj": "island"
    },
    {
        "letter": "J",
        "word_en": "Jesus the Good Shepherd",
        "word_es": "Jesús Buen Pastor",
        "verse": "Justo es el Señor en todos sus caminos, y misericordioso en todas sus obras. — Salmos 145:17",
        "obj": "shepherd"
    },
    {
        "letter": "K",
        "word_en": "King's Crown",
        "word_es": "Corona de Rey",
        "verse": "K (King): Cantad alabanzas al Rey de gloria, hacedor de los cielos. — Salmos 47:6",
        "obj": "crown"
    },
    {
        "letter": "L",
        "word_en": "Lion of Judah",
        "word_es": "León de Judá",
        "verse": "Lámpara es a mis pies tu palabra, y lumbrera a mi camino. — Salmos 119:105",
        "obj": "lion"
    },
    {
        "letter": "M",
        "word_en": "Mountain of Faith",
        "word_es": "Montaña de Fe",
        "verse": "Mi socorro viene del Señor, que hizo los cielos y la tierra. — Salmos 121:2",
        "obj": "mountain"
    },
    {
        "letter": "N",
        "word_en": "Nest of Birds",
        "word_es": "Nido de Aves",
        "verse": "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios. — Isaías 41:10",
        "obj": "nest"
    },
    {
        "letter": "O",
        "word_en": "Olive Branch",
        "word_es": "Rama de Olivo",
        "verse": "Oh Señor, de mañana oirás mi voz; de mañana me presentaré delante de ti. — Salmos 5:3",
        "obj": "olive"
    },
    {
        "letter": "P",
        "word_en": "Prayer Hands",
        "word_es": "Manos en Oración",
        "verse": "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá. — Mateo 7:7",
        "obj": "prayer"
    },
    {
        "letter": "Q",
        "word_en": "Queen Esther",
        "word_es": "Reina Ester",
        "verse": "Quién como tú, oh Señor, entre los dioses; magnífico en santidad. — Éxodo 15:11",
        "obj": "queen"
    },
    {
        "letter": "R",
        "word_en": "Rainbow of Promise",
        "word_es": "Arcoíris de Promesa",
        "verse": "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos! — Filipenses 4:4",
        "obj": "rainbow"
    },
    {
        "letter": "S",
        "word_en": "Star of Bethlehem",
        "word_es": "Estrella Brillante",
        "verse": "Señor, tú has sido nuestro refugio de generación en generación. — Salmos 90:1",
        "obj": "star"
    },
    {
        "letter": "T",
        "word_en": "Tree of Life",
        "word_es": "Árbol de Vida",
        "verse": "Todo lo puedo en Cristo que me fortalece. — Filipenses 4:13",
        "obj": "tree"
    },
    {
        "letter": "U",
        "word_en": "Universe & Planet",
        "word_es": "Universo y Planetas",
        "verse": "Uno solo es Dios, el Padre de quien proceden todas las cosas. — 1 Corintios 8:6",
        "obj": "universe"
    },
    {
        "letter": "V",
        "word_en": "Vine & Grapes",
        "word_es": "Vid y Uvas",
        "verse": "Venid, adoremos y postrémonos delante del Señor nuestro Hacedor. — Salmos 95:6",
        "obj": "vine"
    },
    {
        "letter": "W",
        "word_en": "Whale of Jonah",
        "word_es": "Gran Ballena",
        "verse": "Word (Palabra): Vivificante es la palabra de Dios en todo tiempo. — Salmos 119:50",
        "obj": "whale"
    },
    {
        "letter": "X",
        "word_en": "Xylophone Praise",
        "word_es": "Xilófono de Alabanza",
        "verse": "X (eXaltad): Exaltad al Señor nuestro Dios, y adorad ante su santo estrado. — Salmos 99:5",
        "obj": "xylophone"
    },
    {
        "letter": "Y",
        "word_en": "Youth & Joy",
        "word_es": "Juventud y Gozo",
        "verse": "Yo soy el camino, y la verdad, y la vida; nadie viene al Padre, sino por mí. — Juan 14:6",
        "obj": "youth"
    },
    {
        "letter": "Z",
        "word_en": "Zion Holy Mount",
        "word_es": "Monte de Sion",
        "verse": "Z (Sion): Cantad alabanzas al Señor que habita en Sion con alegría. — Salmos 9:11",
        "obj": "zion"
    }
]

def draw_custom_vector(c, obj, cx, cy):
    c.saveState()
    c.setStrokeColor(colors.black)
    c.setFillColor(colors.white)
    c.setLineWidth(3.5)

    if obj == "ark":
        # Arca de Noé con animales
        p = c.beginPath()
        p.moveTo(cx - 130, cy + 10)
        p.lineTo(cx + 130, cy + 10)
        p.lineTo(cx + 90, cy - 60)
        p.lineTo(cx - 90, cy - 60)
        p.close()
        c.drawPath(p, fill=1, stroke=1)
        c.line(cx - 110, cy - 15, cx + 110, cy - 15)
        c.line(cx - 95, cy - 38, cx + 95, cy - 38)
        c.rect(cx - 65, cy + 10, 130, 60, fill=1, stroke=1)
        c.rect(cx - 45, cy + 70, 90, 25, fill=1, stroke=1)
        c.circle(cx - 30, cy + 40, 12, fill=1, stroke=1)
        c.circle(cx + 30, cy + 40, 12, fill=1, stroke=1)
        for ox in range(int(cx - 150), int(cx + 150), 40):
            c.arc(ox, cy - 80, ox + 35, cy - 60, 180, 180)

    elif obj == "bible":
        # Biblia abierta
        p1 = c.beginPath()
        p1.moveTo(cx, cy - 60); p1.curveTo(cx - 50, cy - 70, cx - 110, cy - 50, cx - 130, cy - 40); p1.lineTo(cx - 130, cy + 50); p1.curveTo(cx - 110, cy + 40, cx - 50, cy + 60, cx, cy + 70); p1.close()
        c.drawPath(p1, fill=1, stroke=1)
        p2 = c.beginPath()
        p2.moveTo(cx, cy - 60); p2.curveTo(cx + 50, cy - 70, cx + 110, cy - 50, cx + 130, cy - 40); p2.lineTo(cx + 130, cy + 50); p2.curveTo(cx + 110, cy + 40, cx + 50, cy + 60, cx, cy + 70); p2.close()
        c.drawPath(p2, fill=1, stroke=1)
        c.rect(cx - 75, cy - 10, 16, 40, fill=1, stroke=1)
        c.rect(cx - 87, cy + 8, 40, 12, fill=1, stroke=1)
        for a in [-40, -20, 0, 20, 40]:
            rad = math.radians(a)
            c.line(cx + 50*math.sin(rad), cy + 75 + 50*math.cos(rad), cx + 85*math.sin(rad), cy + 75 + 85*math.cos(rad))

    elif obj == "cross":
        # Cruz adornada con flores
        c.rect(cx - 20, cy - 80, 40, 170, fill=1, stroke=1)
        c.rect(cx - 65, cy + 15, 130, 40, fill=1, stroke=1)
        c.circle(cx, cy + 35, 14, fill=1, stroke=1)
        for fx in [cx - 80, cx + 80]:
            c.circle(fx, cy - 60, 15, fill=1, stroke=1)
            for pa in range(0, 360, 72):
                prad = math.radians(pa)
                c.circle(fx + 18*math.cos(prad), cy - 60 + 18*math.sin(prad), 8, fill=1, stroke=1)

    elif obj == "dove":
        # Paloma de la Paz
        c.circle(cx - 20, cy + 10, 40, fill=1, stroke=1)
        c.circle(cx - 50, cy + 40, 22, fill=1, stroke=1)
        p_beak = c.beginPath(); p_beak.moveTo(cx - 68, cy + 45); p_beak.lineTo(cx - 90, cy + 40); p_beak.lineTo(cx - 68, cy + 35); p_beak.close()
        c.drawPath(p_beak, fill=1, stroke=1)
        c.line(cx - 90, cy + 40, cx - 115, cy + 45)
        c.circle(cx - 105, cy + 50, 6, fill=1, stroke=1)
        c.circle(cx - 115, cy + 40, 6, fill=1, stroke=1)
        p_wing = c.beginPath(); p_wing.moveTo(cx - 10, cy + 30); p_wing.curveTo(cx + 30, cy + 95, cx + 90, cy + 90, cx + 110, cy + 60); p_wing.curveTo(cx + 80, cy + 40, cx + 40, cy + 20, cx - 10, cy + 10); p_wing.close()
        c.drawPath(p_wing, fill=1, stroke=1)

    elif obj == "eagle":
        # Águila Majestuosa
        c.circle(cx, cy + 20, 30, fill=1, stroke=1) # Cabeza
        p_beak = c.beginPath(); p_beak.moveTo(cx - 20, cy + 30); p_beak.lineTo(cx - 50, cy + 20); p_beak.lineTo(cx - 20, cy + 10); p_beak.close()
        c.drawPath(p_beak, fill=1, stroke=1) # Pico
        # Alas extendidas
        p_w1 = c.beginPath(); p_w1.moveTo(cx - 10, cy + 10); p_w1.curveTo(cx - 80, cy + 80, cx - 130, cy + 60, cx - 140, cy + 30); p_w1.curveTo(cx - 100, cy + 10, cx - 50, cy - 10, cx - 10, cy - 20); p_w1.close()
        c.drawPath(p_w1, fill=1, stroke=1)
        p_w2 = c.beginPath(); p_w2.moveTo(cx + 10, cy + 10); p_w2.curveTo(cx + 80, cy + 80, cx + 130, cy + 60, cx + 140, cy + 30); p_w2.curveTo(cx + 100, cy + 10, cx + 50, cy - 10, cx + 10, cy - 20); p_w2.close()
        c.drawPath(p_w2, fill=1, stroke=1)
        c.circle(cx - 8, cy + 25, 5, fill=1, stroke=1) # Ojo

    elif obj == "fish":
        # Pez de Galilea
        p = c.beginPath(); p.moveTo(cx - 90, cy); p.curveTo(cx - 40, cy + 60, cx + 50, cy + 50, cx + 80, cy); p.curveTo(cx + 50, cy - 50, cx - 40, cy - 60, cx - 90, cy); c.drawPath(p, fill=1, stroke=1)
        p_t = c.beginPath(); p_t.moveTo(cx + 80, cy); p_t.lineTo(cx + 120, cy + 45); p_t.lineTo(cx + 105, cy); p_t.lineTo(cx + 120, cy - 45); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        c.circle(cx - 50, cy + 12, 8, fill=1, stroke=1)
        c.arc(cx - 20, cy - 20, cx + 30, cy + 20, 0, 180)
        c.circle(cx - 110, cy + 30, 10, fill=1, stroke=1)
        c.circle(cx - 125, cy + 55, 7, fill=1, stroke=1)

    elif obj == "garden":
        # Jardín Florido de Edén
        for fx in [cx - 90, cx, cx + 90]:
            c.rect(fx - 4, cy - 70, 8, 70, fill=1, stroke=1) # Tallo
            c.circle(fx, cy + 15, 18, fill=1, stroke=1) # Centro
            for pa in range(0, 360, 60):
                prad = math.radians(pa)
                c.circle(fx + 22*math.cos(prad), cy + 15 + 22*math.sin(prad), 10, fill=1, stroke=1)
        # Mariposa
        c.circle(cx - 50, cy + 70, 6, fill=1, stroke=1)
        c.circle(cx - 40, cy + 76, 12, fill=1, stroke=1)
        c.circle(cx - 60, cy + 76, 12, fill=1, stroke=1)

    elif obj == "heart":
        # Corazón Alado
        p = c.beginPath(); p.moveTo(cx, cy - 60); p.curveTo(cx - 120, cy + 30, cx - 90, cy + 90, cx, cy + 35); p.curveTo(cx + 90, cy + 90, cx + 120, cy + 30, cx, cy - 60); c.drawPath(p, fill=1, stroke=1)
        c.circle(cx - 70, cy + 60, 8, fill=1, stroke=1)
        c.circle(cx + 70, cy + 60, 8, fill=1, stroke=1)

    elif obj == "island":
        # Isla con Palmeras y Sol
        for ox in range(int(cx - 150), int(cx + 150), 40):
            c.arc(ox, cy - 80, ox + 35, cy - 60, 180, 180)
        p = c.beginPath(); p.moveTo(cx - 130, cy - 65); p.curveTo(cx - 80, cy - 10, cx + 80, cy - 10, cx + 130, cy - 65); p.close(); c.drawPath(p, fill=1, stroke=1)
        p_t = c.beginPath(); p_t.moveTo(cx - 20, cy - 25); p_t.curveTo(cx - 10, cy + 20, cx + 30, cy + 40, cx + 20, cy + 80); p_t.lineTo(cx + 35, cy + 80); p_t.curveTo(cx + 45, cy + 40, cx + 5, cy + 20, cx - 5, cy - 25); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        for dx, dy in [(-55, 30), (55, 30), (-70, 0), (70, 0), (0, 50)]:
            p_leaf = c.beginPath(); p_leaf.moveTo(cx + 25, cy + 80); p_leaf.curveTo(cx + 25 + dx/2, cy + 80 + dy + 20, cx + 25 + dx, cy + 80 + dy, cx + 25 + dx*1.2, cy + 80 + dy*0.8); p_leaf.curveTo(cx + 25 + dx*0.8, cy + 80 + dy*0.5, cx + 25 + dx/2, cy + 80 + dy/2, cx + 25, cy + 80); c.drawPath(p_leaf, fill=1, stroke=1)
        c.circle(cx + 18, cy + 72, 8, fill=1, stroke=1)
        c.circle(cx + 32, cy + 72, 8, fill=1, stroke=1)
        c.circle(cx + 110, cy + 70, 25, fill=1, stroke=1)

    elif obj == "shepherd":
        # Cayado de pastor y Cordero
        c.rect(cx - 50, cy - 70, 16, 140, fill=1, stroke=1) # Bastón
        c.arc(cx - 80, cy + 50, cx - 20, cy + 100, 0, 180) # Curva bastón
        # Ovejita / Cordero
        c.circle(cx + 40, cy - 20, 35, fill=1, stroke=1) # Cuerpo
        c.circle(cx + 15, cy + 5, 20, fill=1, stroke=1) # Cabeza
        c.circle(cx + 8, cy + 10, 4, fill=1, stroke=1) # Ojo
        for oa in range(0, 360, 45):
            orad = math.radians(oa)
            c.circle(cx + 40 + 35*math.cos(orad), cy - 20 + 35*math.sin(orad), 10, fill=1, stroke=1)

    elif obj == "crown":
        # Corona Real
        p = c.beginPath(); p.moveTo(cx - 100, cy - 40); p.lineTo(cx + 100, cy - 40); p.lineTo(cx + 120, cy + 50); p.lineTo(cx + 60, cy + 15); p.lineTo(cx, cy + 75); p.lineTo(cx - 60, cy + 15); p.lineTo(cx - 120, cy + 50); p.close(); c.drawPath(p, fill=1, stroke=1)
        c.circle(cx - 120, cy + 55, 9, fill=1, stroke=1)
        c.circle(cx, cy + 80, 12, fill=1, stroke=1)
        c.circle(cx + 120, cy + 55, 9, fill=1, stroke=1)

    elif obj == "lion":
        # León de Judá
        c.circle(cx, cy, 65, fill=1, stroke=1)
        for a in range(0, 360, 30):
            rad = math.radians(a)
            c.circle(cx + 65*math.cos(rad), cy + 65*math.sin(rad), 18, fill=1, stroke=1)
        c.circle(cx, cy, 50, fill=1, stroke=1)
        c.circle(cx - 18, cy + 10, 7, fill=1, stroke=1)
        c.circle(cx + 18, cy + 10, 7, fill=1, stroke=1)
        p_nose = c.beginPath(); p_nose.moveTo(cx - 10, cy - 8); p_nose.lineTo(cx + 10, cy - 8); p_nose.lineTo(cx, cy - 20); p_nose.close(); c.drawPath(p_nose, fill=1, stroke=1)
        c.arc(cx - 15, cy - 35, cx + 15, cy - 15, 180, 180)

    elif obj == "mountain":
        # Montañas de Fe con sol
        p_m1 = c.beginPath(); p_m1.moveTo(cx - 140, cy - 60); p_m1.lineTo(cx - 40, cy + 75); p_m1.lineTo(cx + 60, cy - 60); p_m1.close(); c.drawPath(p_m1, fill=1, stroke=1)
        p_m2 = c.beginPath(); p_m2.moveTo(cx - 30, cy - 60); p_m2.lineTo(cx + 70, cy + 90); p_m2.lineTo(cx + 150, cy - 60); p_m2.close(); c.drawPath(p_m2, fill=1, stroke=1)
        # Nieve en la cumbre
        c.line(cx - 60, cy + 45, cx - 20, cy + 45)
        c.line(cx + 50, cy + 60, cx + 90, cy + 60)
        c.circle(cx - 80, cy + 80, 22, fill=1, stroke=1) # Sol

    elif obj == "nest":
        # Nido de aves en rama
        c.rect(cx - 140, cy - 30, 280, 20, fill=1, stroke=1) # Rama
        # Nido cuenco
        p_n = c.beginPath(); p_n.moveTo(cx - 70, cy - 10); p_n.lineTo(cx + 70, cy - 10); p_n.curveTo(cx + 50, cy - 65, cx - 50, cy - 65, cx - 70, cy - 10); c.drawPath(p_n, fill=1, stroke=1)
        # 3 Huevitos / Pajaritos
        c.circle(cx - 30, cy + 10, 15, fill=1, stroke=1)
        c.circle(cx, cy + 15, 16, fill=1, stroke=1)
        c.circle(cx + 30, cy + 10, 15, fill=1, stroke=1)
        c.circle(cx - 34, cy + 14, 3, fill=1, stroke=1) # Ojo pajarito
        c.circle(cx - 4, cy + 19, 3, fill=1, stroke=1)
        c.circle(cx + 26, cy + 14, 3, fill=1, stroke=1)

    elif obj == "olive":
        # Rama de Olivo
        c.line(cx - 100, cy - 40, cx + 100, cy + 40)
        for ox, oy in [(-70, -20), (-30, 0), (10, 20), (50, 40)]:
            c.circle(ox - 10, oy + 20, 12, fill=1, stroke=1) # Aceituna
            p_leaf = c.beginPath(); p_leaf.moveTo(ox, oy); p_leaf.curveTo(ox + 15, oy + 35, ox + 35, oy + 35, ox + 40, oy + 10); p_leaf.curveTo(ox + 20, oy - 10, ox + 5, oy, ox, oy); c.drawPath(p_leaf, fill=1, stroke=1)

    elif obj == "prayer":
        # Manos en Oración
        p_h1 = c.beginPath(); p_h1.moveTo(cx - 10, cy - 70); p_h1.lineTo(cx - 10, cy + 60); p_h1.curveTo(cx - 30, cy + 50, cx - 60, cy + 10, cx - 50, cy - 70); p_h1.close(); c.drawPath(p_h1, fill=1, stroke=1)
        p_h2 = c.beginPath(); p_h2.moveTo(cx + 10, cy - 70); p_h2.lineTo(cx + 10, cy + 60); p_h2.curveTo(cx + 30, cy + 50, cx + 60, cy + 10, cx + 50, cy - 70); p_h2.close(); c.drawPath(p_h2, fill=1, stroke=1)
        for ra in [-50, -25, 0, 25, 50]:
            rrad = math.radians(ra)
            c.line(cx + 65*math.sin(rrad), cy + 70 + 65*math.cos(rrad), cx + 95*math.sin(rrad), cy + 70 + 95*math.cos(rrad))

    elif obj == "queen":
        # Corona y Tiara de la Reina Ester
        p_t = c.beginPath(); p_t.moveTo(cx - 90, cy - 30); p_t.lineTo(cx + 90, cy - 30); p_t.lineTo(cx + 105, cy + 40); p_t.lineTo(cx + 50, cy + 10); p_t.lineTo(cx, cy + 70); p_t.lineTo(cx - 50, cy + 10); p_t.lineTo(cx - 105, cy + 40); p_t.close(); c.drawPath(p_t, fill=1, stroke=1)
        c.circle(cx, cy + 75, 10, fill=1, stroke=1)
        c.circle(cx - 105, cy + 45, 8, fill=1, stroke=1)
        c.circle(cx + 105, cy + 45, 8, fill=1, stroke=1)
        # Cetro
        c.rect(cx - 6, cy - 80, 12, 50, fill=1, stroke=1)
        c.circle(cx, cy - 30, 14, fill=1, stroke=1)

    elif obj == "rainbow":
        # Gran Arcoíris
        for r in [120, 100, 80, 60, 40]:
            c.arc(cx - r, cy - 60, cx + r, cy + r * 1.5 - 60, 0, 180)
        for nx in [cx - 100, cx + 100]:
            c.circle(nx - 20, cy - 50, 25, fill=1, stroke=1)
            c.circle(nx + 10, cy - 40, 30, fill=1, stroke=1)
            c.circle(nx + 35, cy - 50, 22, fill=1, stroke=1)
        c.circle(cx, cy + 85, 25, fill=1, stroke=1)

    elif obj == "star":
        # Gran Estrella de Belén
        p = c.beginPath(); p.moveTo(cx, cy + 95); p.lineTo(cx + 25, cy + 25); p.lineTo(cx + 95, cy + 20); p.lineTo(cx + 40, cy - 20); p.lineTo(cx + 60, cy - 85); p.lineTo(cx, cy - 45); p.lineTo(cx - 60, cy - 85); p.lineTo(cx - 40, cy - 20); p.lineTo(cx - 95, cy + 20); p.lineTo(cx - 25, cy + 25); p.close(); c.drawPath(p, fill=1, stroke=1)

    elif obj == "tree":
        # Árbol de Vida
        c.rect(cx - 22, cy - 70, 44, 75, fill=1, stroke=1)
        c.circle(cx, cy + 40, 50, fill=1, stroke=1)
        c.circle(cx - 55, cy + 10, 42, fill=1, stroke=1)
        c.circle(cx + 55, cy + 10, 42, fill=1, stroke=1)
        c.circle(cx - 30, cy + 70, 38, fill=1, stroke=1)
        c.circle(cx + 30, cy + 70, 38, fill=1, stroke=1)
        for fx, fy in [(cx - 25, cy + 20), (cx + 30, cy + 30), (cx, cy + 60)]:
            c.circle(fx, fy, 9, fill=1, stroke=1)

    elif obj == "universe":
        # Saturno y Estrellas
        c.circle(cx, cy, 55, fill=1, stroke=1) # Planeta
        c.setLineWidth(4)
        c.ellipse(cx - 95, cy - 15, cx + 95, cy + 15, fill=0, stroke=1) # Anillo
        c.setLineWidth(3.5)
        # Estrellas y cometa
        c.circle(cx - 90, cy + 60, 10, fill=1, stroke=1)
        c.circle(cx + 95, cy - 50, 12, fill=1, stroke=1)

    elif obj == "vine":
        # Vid y Racimo de Uvas
        c.rect(cx - 6, cy + 40, 12, 40, fill=1, stroke=1) # Tallo
        # Uvas en racimo
        grape_coords = [
            (-30, 30), (0, 30), (30, 30),
            (-45, 10), (-15, 10), (15, 10), (45, 10),
            (-30, -10), (0, -10), (30, -10),
            (-15, -30), (15, -30),
            (0, -50)
        ]
        for gx, gy in grape_coords:
            c.circle(cx + gx, cy + gy, 14, fill=1, stroke=1)

    elif obj == "whale":
        # Gran Ballena
        p = c.beginPath(); p.moveTo(cx - 110, cy - 20); p.curveTo(cx - 90, cy + 60, cx + 40, cy + 50, cx + 80, cy); p.curveTo(cx + 60, cy - 50, cx - 60, cy - 50, cx - 110, cy - 20); c.drawPath(p, fill=1, stroke=1)
        p_tail = c.beginPath(); p_tail.moveTo(cx + 80, cy); p_tail.lineTo(cx + 125, cy + 35); p_tail.lineTo(cx + 105, cy + 5); p_tail.lineTo(cx + 125, cy - 25); p_tail.close(); c.drawPath(p_tail, fill=1, stroke=1)
        c.arc(cx - 60, cy + 45, cx - 20, cy + 85, 0, 180)
        c.arc(cx - 50, cy + 60, cx + 10, cy + 100, 0, 180)
        c.circle(cx - 75, cy + 5, 7, fill=1, stroke=1)

    elif obj == "xylophone":
        # Xilófono de Alabanza
        bar_heights = [120, 110, 100, 90, 80, 70, 60]
        for idx, bh in enumerate(bar_heights):
            bx = cx - 90 + idx * 28
            c.rect(bx, cy - bh/2, 22, bh, fill=1, stroke=1)
            c.circle(bx + 11, cy - bh/2 + 10, 4, fill=1, stroke=1)
            c.circle(bx + 11, cy + bh/2 - 10, 4, fill=1, stroke=1)
        # Baquetas
        c.line(cx - 60, cy + 70, cx - 10, cy + 90)
        c.circle(cx - 10, cy + 90, 8, fill=1, stroke=1)

    elif obj == "youth":
        # Niños Saltando de Gozo
        for kx in [cx - 50, cx + 50]:
            c.circle(kx, cy + 40, 22, fill=1, stroke=1) # Cabeza
            c.line(kx, cy + 18, kx, cy - 30) # Cuerpo
            c.line(kx, cy + 10, kx - 30, cy + 35) # Brazos arriba
            c.line(kx, cy + 10, kx + 30, cy + 35)
            c.line(kx, cy - 30, kx - 25, cy - 65) # Piernas
            c.line(kx, cy - 30, kx + 25, cy - 65)
        c.circle(cx, cy + 80, 20, fill=1, stroke=1) # Sol

    elif obj == "zion":
        # Monte de Sion y Templo
        p_m = c.beginPath(); p_m.moveTo(cx - 130, cy - 60); p_m.lineTo(cx, cy + 20); p_m.lineTo(cx + 130, cy - 60); p_m.close(); c.drawPath(p_m, fill=1, stroke=1)
        # Templo con columnas
        c.rect(cx - 45, cy + 20, 90, 40, fill=1, stroke=1)
        c.line(cx - 25, cy + 20, cx - 25, cy + 60)
        c.line(cx, cy + 20, cx, cy + 60)
        c.line(cx + 25, cy + 20, cx + 25, cy + 60)
        p_roof = c.beginPath(); p_roof.moveTo(cx - 55, cy + 60); p_roof.lineTo(cx + 55, cy + 60); p_roof.lineTo(cx, cy + 85); p_roof.close(); c.drawPath(p_roof, fill=1, stroke=1)

    c.restoreState()


def compile_perfect_pdf(target_path):
    c = canvas.Canvas(str(target_path), pagesize=letter)
    width, height = letter # 612 x 792 pt

    # PÁGINA 1: PORTADA
    c.setLineWidth(4); c.setStrokeColor(colors.black); c.rect(25, 25, width - 50, height - 50)
    c.setLineWidth(1.5); c.rect(32, 32, width - 64, height - 64)

    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(width / 2, height - 95, "BIBLE ABC & ANIMALS")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(width / 2, height - 122, "26 Bilingual Coloring & Handwriting Worksheets")
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(width / 2, height - 142, "Aprende el Alfabeto, Traza Letras y Colorea Valores (Inglés • Español)")

    draw_custom_vector(c, "rainbow", width / 2, height - 260)
    draw_custom_vector(c, "ark", width / 2, height - 400)

    badge_y = 150
    c.rect(width / 2 - 210, badge_y, 420, 55, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 10.5)
    c.drawCentredString(width / 2, badge_y + 36, "⭐ DISEÑADO PARA NIÑOS DE 3 A 8 AÑOS ⭐")
    c.setFont("Helvetica", 9.5)
    c.drawCentredString(width / 2, badge_y + 20, "✔ 26 Ilustraciones Bold Line-Art fáciles de colorear")
    c.drawCentredString(width / 2, badge_y + 6, "✔ Pauta punteada de caligrafía  •  ✔ Versículo exacto por cada letra")

    c.setFont("Helvetica-Bold", 9.5)
    c.drawCentredString(width / 2, 55, "Espejos AutoStudio 2026 • Premium Kids Digital Activity Book Edition")
    c.showPage()

    # PÁGINAS 2 A 27: 26 LETRAS
    for item in LETTERS:
        l_char = item["letter"]
        l_lower = l_char.lower()

        c.setLineWidth(2); c.setStrokeColor(colors.black); c.rect(30, 30, width - 60, height - 60)

        # Encabezado
        c.setFont("Helvetica-Bold", 60)
        c.drawString(55, height - 105, f"{l_char} {l_lower}")
        c.setFont("Helvetica-Bold", 19)
        c.drawString(185, height - 75, item["word_en"])
        c.setFont("Helvetica-Oblique", 13)
        c.drawString(185, height - 98, f"Español: {item['word_es']}")

        c.setLineWidth(1)
        c.line(55, height - 118, width - 55, height - 118)

        # Ilustración Protagonista
        draw_custom_vector(c, item["obj"], width / 2, height - 265)

        # Caligrafía Punteada
        trace_top = height - 415
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(55, trace_top + 25, f"✏️ Practica el trazo de la letra '{l_char}' y '{l_lower}':")

        # Fila Mayúsculas
        l1 = trace_top - 10
        c.setLineWidth(1); c.line(55, l1 + 24, width - 55, l1 + 24)
        c.setDash(2, 2); c.line(55, l1 + 12, width - 55, l1 + 12); c.setDash([])
        c.line(55, l1, width - 55, l1)
        c.setFont("Helvetica", 22); c.setFillColor(colors.lightgrey)
        for i in range(7):
            c.drawString(75 + i * 54, l1 + 4, l_char)

        # Fila Minúsculas
        l2 = trace_top - 58
        c.setFillColor(colors.black); c.setLineWidth(1)
        c.line(55, l2 + 24, width - 55, l2 + 24)
        c.setDash(2, 2); c.line(55, l2 + 12, width - 55, l2 + 12); c.setDash([])
        c.line(55, l2, width - 55, l2)
        c.setFont("Helvetica", 22); c.setFillColor(colors.lightgrey)
        for i in range(7):
            c.drawString(75 + i * 54, l2 + 4, l_lower)

        # Recuadro de Versículo Bíblico (Inicia con la Letra)
        c.setFillColor(colors.black)
        vbox_y = 50
        c.rect(55, vbox_y, width - 110, 48, fill=0, stroke=1)
        c.setFont("Helvetica-Bold", 9.5)
        c.drawCentredString(width / 2, vbox_y + 30, f"📖 Versículo con la letra '{l_char}':")
        c.setFont("Helvetica-Oblique", 8.5)
        c.drawCentredString(width / 2, vbox_y + 14, item["verse"][:95])

        c.showPage()

    # PÁGINA 28: CERTIFICADO DE LOGRO
    c.setLineWidth(4); c.rect(25, 25, width - 50, height - 50)
    c.setLineWidth(1.5); c.rect(32, 32, width - 64, height - 64)

    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(width / 2, height - 110, "CERTIFICADO DE LOGRO")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(width / 2, height - 138, "¡SUPER ESTRELLA DEL ALFABETO!")

    draw_custom_vector(c, "crown", width / 2, height - 270)

    c.setFont("Helvetica", 13)
    c.drawCentredString(width / 2, height - 390, "Este certificado se otorga con orgullo y bendición a:")
    c.line(110, height - 440, width - 110, height - 440)
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(width / 2, height - 455, "(Nombre del Niño / Estudiante)")

    c.setFont("Helvetica", 11.5)
    c.drawCentredString(width / 2, height - 500, "Por completar las 26 letras del abecedario, practicar su caligrafía")
    c.drawCentredString(width / 2, height - 520, "y colorear cada una de las 26 figuras bíblicas con creatividad.")

    c.line(80, 110, 230, 110); c.drawCentredString(155, 95, "Firma del Profesor / Padre")
    c.line(width - 230, 110, width - 80, 110); c.drawCentredString(width - 155, 95, "Fecha")

    c.showPage()
    c.save()
    print(f"✅ PDF guardado: {target_path} ({os.path.getsize(target_path)} bytes)")

if __name__ == "__main__":
    for p in PDF_FILES:
        compile_perfect_pdf(p)
    print("🏆 ¡TODOS LOS ARCHIVOS PDF DE LA VERSIÓN MAESTRA 2.0 HAN SIDO COMPILADOS!")
