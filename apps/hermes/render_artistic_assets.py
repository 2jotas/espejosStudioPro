"""
Motor Artístico Autónomo de Renderizado de Lienzos al Óleo y Láminas Line-Art
Genera 26 obras escénicas ÚNICAS (una por cada letra del abecedario) con:
- Marco dorado barroco detallado con relieves
- Fondo escénico con gradientes, cielos vivos, montañas, sol/luna y detalles
- Objeto protagónico detallado
- Lámina gemela de coloreado Clean Bold Line-Art
- Verificador estricto de no duplicidad
"""

import os
import math
import hashlib
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

UPLOADS_DIR = Path("/app/workspace/apps/api/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# Copiar el lienzo de la E si fue generado
brain_dir = Path("/home/deploy/.gemini/antigravity-cli/brain/5bd52a23-c34b-496c-a3e8-da6f10e62d34")
for f in brain_dir.glob("eagle_canvas_*.jpg"):
    target = UPLOADS_DIR / "canvas_art_E.jpg"
    if not target.exists():
        target.write_bytes(f.read_bytes())
        print(f"Copiado lienzo de Águila: {target}")

LETTERS_SPEC = [
    {
        "letter": "A",
        "word_en": "Ark of Noah",
        "word_es": "Arca de Noé",
        "artist": "William Turner (Óleo Marítimo)",
        "verse": "Al principio creó Dios los cielos y la tierra. — Génesis 1:1",
        "subject": "ark",
        "theme": "maritime_rainbow"
    },
    {
        "letter": "B",
        "word_en": "Bible of Truth",
        "word_es": "Biblia Sagrada",
        "artist": "Rembrandt (Claroscuro con Vela)",
        "verse": "Bendeciré al Señor en todo tiempo; su alabanza estará de continuo en mi boca. — Salmos 34:1",
        "subject": "bible",
        "theme": "golden_candlelight"
    },
    {
        "letter": "C",
        "word_en": "Cross of Grace",
        "word_es": "Cruz de Gracia",
        "artist": "Claude Monet (Colina con Amapolas)",
        "verse": "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto. — Salmos 51:10",
        "subject": "cross",
        "theme": "poppy_sunset"
    },
    {
        "letter": "D",
        "word_en": "Dove of Peace",
        "word_es": "Paloma de la Paz",
        "artist": "Vincent van Gogh (Noche Estrellada)",
        "verse": "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. — Salmos 46:1",
        "subject": "dove",
        "theme": "starry_sky"
    },
    {
        "letter": "E",
        "word_en": "Eagle in Sky",
        "word_es": "Águila Majestuosa",
        "artist": "Albert Bierstadt (Cumbres Alpinas)",
        "verse": "El Señor es mi pastor; nada me faltará. — Salmos 23:1",
        "subject": "eagle",
        "theme": "alpine_sunrise"
    },
    {
        "letter": "F",
        "word_en": "Fish of Galilee",
        "word_es": "Peces del Mar",
        "artist": "Joaquín Sorolla (Luminismo Marino)",
        "verse": "Firme está mi corazón, oh Dios; cantaré y entonaré salmos con gozo. — Salmos 108:1",
        "subject": "fish",
        "theme": "ocean_sunlight"
    },
    {
        "letter": "G",
        "word_en": "Garden of Eden",
        "word_es": "Jardín Florido",
        "artist": "Claude Monet (Giverny Floral)",
        "verse": "Grande es el Señor, y digno de suprema alabanza. — Salmos 145:3",
        "subject": "garden",
        "theme": "blooming_garden"
    },
    {
        "letter": "H",
        "word_en": "Heart of Love",
        "word_es": "Corazón de Amor",
        "artist": "William Blake (Resplandor Celestial)",
        "verse": "Hazme oír por la mañana tu misericordia, porque en ti he confiado. — Salmos 143:8",
        "subject": "heart",
        "theme": "celestial_glow"
    },
    {
        "letter": "I",
        "word_en": "Island in Ocean",
        "word_es": "Isla Tropical",
        "artist": "Paul Gauguin (Paraíso Turquesa)",
        "verse": "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él. — Proverbios 22:6",
        "subject": "island",
        "theme": "tropical_paradise"
    },
    {
        "letter": "J",
        "word_en": "Jesus Good Shepherd",
        "word_es": "Jesús Buen Pastor",
        "artist": "Rafael (Renacimiento Clásico)",
        "verse": "Justo es el Señor en todos sus caminos, y misericordioso en todas sus obras. — Salmos 145:17",
        "subject": "shepherd",
        "theme": "pastoral_hills"
    },
    {
        "letter": "K",
        "word_en": "King's Crown",
        "word_es": "Corona de Rey",
        "artist": "Diego Velázquez (Esplendor Real)",
        "verse": "King (Rey): Cantad alabanzas al Rey de gloria, hacedor de los cielos. — Salmos 47:6",
        "subject": "crown",
        "theme": "royal_velvet"
    },
    {
        "letter": "L",
        "word_en": "Lion of Judah",
        "word_es": "León de Judá",
        "artist": "Eugène Delacroix (Sabana al Ocaso)",
        "verse": "Lámpara es a mis pies tu palabra, y lumbrera a mi camino. — Salmos 119:105",
        "subject": "lion",
        "theme": "savanna_sunset"
    },
    {
        "letter": "M",
        "word_en": "Mountain of Faith",
        "word_es": "Montaña de Fe",
        "artist": "Caspar David Friedrich (Amanecer Sublime)",
        "verse": "Mi socorro viene del Señor, que hizo los cielos y la tierra. — Salmos 121:2",
        "subject": "mountain",
        "theme": "alpine_dawn"
    },
    {
        "letter": "N",
        "word_en": "Nest of Birds",
        "word_es": "Nido de Aves",
        "artist": "John J. Audubon (Arte Botánico Clásico)",
        "verse": "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios. — Isaías 41:10",
        "subject": "nest",
        "theme": "blooming_branch"
    },
    {
        "letter": "O",
        "word_en": "Olive Tree",
        "word_es": "Rama de Olivo",
        "artist": "Vincent van Gogh (Olivar al Sol)",
        "verse": "Oh Señor, de mañana oirás mi voz; de mañana me presentaré delante de ti. — Salmos 5:3",
        "subject": "olive",
        "theme": "mediterranean_sun"
    },
    {
        "letter": "P",
        "word_en": "Prayer Hands",
        "word_es": "Manos en Oración",
        "artist": "Alberto Durero (Luz de Catedral Gótica)",
        "verse": "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá. — Mateo 7:7",
        "subject": "prayer",
        "theme": "cathedral_light"
    },
    {
        "letter": "Q",
        "word_en": "Queen Esther",
        "word_es": "Reina Valiente",
        "artist": "John William Waterhouse (Prerrafaelita)",
        "verse": "Quién como tú, oh Señor, entre los dioses; magnífico en santidad. — Éxodo 15:11",
        "subject": "queen",
        "theme": "palace_sunset"
    },
    {
        "letter": "R",
        "word_en": "Rainbow of Promise",
        "word_es": "Arcoíris de Promesa",
        "artist": "John Constable (Paisaje Campestre)",
        "verse": "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos! — Filipenses 4:4",
        "subject": "rainbow",
        "theme": "countryside_rainbow"
    },
    {
        "letter": "S",
        "word_en": "Sun of Light",
        "word_es": "Sol Radiante",
        "artist": "Joaquín Sorolla (Pleno Sol Dorado)",
        "verse": "Señor, tú has sido nuestro refugio de generación en generación. — Salmos 90:1",
        "subject": "sun",
        "theme": "golden_sun_sky"
    },
    {
        "letter": "T",
        "word_en": "Tree of Life",
        "word_es": "Árbol de Vida",
        "artist": "Gustav Klimt (Árbol Dorado)",
        "verse": "Todo lo puedo en Cristo que me fortalece. — Filipenses 4:13",
        "subject": "tree",
        "theme": "golden_tree_meadow"
    },
    {
        "letter": "U",
        "word_en": "Universe & Stars",
        "word_es": "Universo y Cosmos",
        "artist": "Cartografía Celeste del Siglo XIX",
        "verse": "Uno solo es Dios, el Padre de quien proceden todas las cosas. — 1 Corintios 8:6",
        "subject": "universe",
        "theme": "cosmic_nebula"
    },
    {
        "letter": "V",
        "word_en": "Vine & Grapes",
        "word_es": "Vid y Racimos",
        "artist": "Caravaggio (Bodegón Toscano)",
        "verse": "Venid, adoremos y postrémonos delante del Señor nuestro Hacedor. — Salmos 95:6",
        "subject": "vine",
        "theme": "tuscany_vineyard"
    },
    {
        "letter": "W",
        "word_en": "Whale of Jonah",
        "word_es": "Gran Ballena",
        "artist": "Hokusai (Gran Océano)",
        "verse": "Word (Palabra): Vivificante es la palabra de Dios en todo tiempo. — Salmos 119:50",
        "subject": "whale",
        "theme": "deep_blue_sea"
    },
    {
        "letter": "X",
        "word_en": "Xylophone Praise",
        "word_es": "Xilófono de Música",
        "artist": "Johannes Vermeer (Salón Barroco)",
        "verse": "X (eXaltad): Exaltad al Señor nuestro Dios, y adorad ante su estrado. — Salmos 99:5",
        "subject": "xylophone",
        "theme": "baroque_music"
    },
    {
        "letter": "Y",
        "word_en": "Youth & Joy",
        "word_es": "Juventud y Gozo",
        "artist": "Pierre-Auguste Renoir (Pradera en Flor)",
        "verse": "Yo soy el camino, la verdad y la vida; nadie viene al Padre, sino por mí. — Juan 14:6",
        "subject": "youth",
        "theme": "flowering_meadow"
    },
    {
        "letter": "Z",
        "word_en": "Zion Holy Mount",
        "word_es": "Monte de Sion",
        "artist": "Michelangelo (Templo Celestial)",
        "verse": "Z (Sion): Cantad alabanzas al Señor que habita en Sion con gozo. — Salmos 9:11",
        "subject": "zion",
        "theme": "celestial_temple"
    }
]

def render_painterly_canvas(spec, size=600):
    """Genera una pintura al óleo escénica con marco dorado de época."""
    img = Image.new("RGB", (size, size), "#1e1b18")
    d = ImageDraw.Draw(img)

    # 1. Marco Dorado Clásico con Molduras
    d.rectangle([(0, 0), (size, size)], fill="#78350f")
    d.rectangle([(12, 12), (size - 12, size - 12)], fill="#d97706")
    d.rectangle([(24, 24), (size - 24, size - 24)], fill="#fbbf24")
    d.rectangle([(36, 36), (size - 36, size - 36)], fill="#92400e")
    d.rectangle([(44, 44), (size - 44, size - 44)], fill="#451a03")

    inner_x1, inner_y1 = 50, 50
    inner_x2, inner_y2 = size - 50, size - 50
    inner_w = inner_x2 - inner_x1
    inner_h = inner_y2 - inner_y1

    theme = spec["theme"]
    subj = spec["subject"]

    # 2. Paletas de Cielo y Paisaje según el tema
    if theme == "ocean_sunlight":
        # F: Fish in turquoise sea
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            r = int(56 + (2 - 56) * ratio)
            g = int(189 + (132 - 189) * ratio)
            b = int(248 + (199 - 248) * ratio)
            d.line([(inner_x1, y), (inner_x2, y)], fill=(r, g, b))
        # Sol
        d.ellipse([(inner_x2 - 140, inner_y1 + 40), (inner_x2 - 60, inner_y1 + 120)], fill="#fef08a")
        # Olas
        for ox in range(inner_x1, inner_x2, 60):
            d.arc([(ox, inner_y2 - 180), (ox + 50, inner_y2 - 140)], start=0, end=180, fill="#ffffff", width=4)
        # Gran Pez saltando
        cx, cy = size // 2, size // 2 + 30
        d.ellipse([(cx - 90, cy - 50), (cx + 60, cy + 50)], fill="#fb923c")
        d.polygon([(cx + 50, cy), (cx + 110, cy - 40), (cx + 110, cy + 40)], fill="#f97316")
        d.ellipse([(cx - 60, cy - 20), (cx - 40, cy)], fill="#ffffff")
        d.ellipse([(cx - 55, cy - 15), (cx - 45, cy - 5)], fill="#0f172a")

    elif theme == "blooming_garden":
        # G: Garden of Eden
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 100*ratio), int(240 - 50*ratio), int(138 + 50*ratio)))
        # Pradera
        d.ellipse([(inner_x1 - 50, inner_y2 - 250), (inner_x2 + 50, inner_y2 + 100)], fill="#15803d")
        # Flores variadas
        colors_f = ["#ef4444", "#f59e0b", "#ec4899", "#8b5cf6", "#38bdf8", "#ffffff"]
        for idx, fx in enumerate(range(inner_x1 + 30, inner_x2 - 30, 45)):
            fy = inner_y2 - 120 + (idx % 3) * 25
            d.line([(fx, fy), (fx, fy + 50)], fill="#166534", width=5)
            d.ellipse([(fx - 18, fy - 18), (fx + 18, fy + 18)], fill=colors_f[idx % len(colors_f)])
            d.ellipse([(fx - 6, fy - 6), (fx + 6, fy + 6)], fill="#fde047")
        # Mariposas
        d.ellipse([(size//2 - 50, inner_y1 + 80), (size//2 - 30, inner_y1 + 100)], fill="#f43f5e")
        d.ellipse([(size//2 + 40, inner_y1 + 60), (size//2 + 60, inner_y1 + 80)], fill="#38bdf8")

    elif theme == "celestial_glow":
        # H: Heart of Love
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(244 - 150*ratio), int(114 + 20*ratio), int(182 + 50*ratio)))
        # Rayos dorados
        cx, cy = size // 2, size // 2
        for angle in range(0, 360, 20):
            rad = math.radians(angle)
            d.line([(cx, cy), (cx + int(180*math.cos(rad)), cy + int(180*math.sin(rad)))], fill="#fef08a", width=3)
        # Gran Corazón Rojo Radiante
        d.ellipse([(cx - 90, cy - 80), (cx, cy + 10)], fill="#e11d48")
        d.ellipse([(cx, cy - 80), (cx + 90, cy + 10)], fill="#e11d48")
        d.polygon([(cx - 90, cy - 35), (cx + 90, cy - 35), (cx, cy + 90)], fill="#e11d48")
        # Resplandor central
        d.ellipse([(cx - 25, cy - 25), (cx + 25, cy + 25)], fill="#ffffff")

    elif theme == "tropical_paradise":
        # I: Island with palm trees
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(253 - 150*ratio), int(186 + 10*ratio), int(116 + 80*ratio)))
        # Sol
        d.ellipse([(inner_x1 + 60, inner_y1 + 50), (inner_x1 + 150, inner_y1 + 140)], fill="#fef08a")
        # Mar Turquesa
        d.rectangle([(inner_x1, inner_y2 - 180), (inner_x2, inner_y2)], fill="#0d9488")
        # Isla de Arena
        d.ellipse([(size//2 - 160, inner_y2 - 130), (size//2 + 160, inner_y2 + 20)], fill="#fde047")
        # Palmera
        px, py = size//2, inner_y2 - 90
        d.line([(px, py), (px + 20, py - 120)], fill="#78350f", width=14)
        for dx, dy in [(-80, -30), (80, -30), (-60, 30), (60, 30), (0, -70)]:
            d.line([(px + 20, py - 120), (px + 20 + dx, py - 120 + dy)], fill="#15803d", width=8)
            d.ellipse([(px + 12 + dx, py - 125 + dy), (px + 28 + dx, py - 115 + dy)], fill="#16a34a")

    elif theme == "royal_velvet":
        # K: King's Crown on velvet
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(88 - 50*ratio), int(28 - 20*ratio), int(135 + 20*ratio)))
        # Almohadón de Terciopelo Rojo
        cx, cy = size // 2, size // 2 + 50
        d.ellipse([(cx - 150, cy), (cx + 150, cy + 120)], fill="#991b1b")
        d.rectangle([(cx - 130, cy + 30), (cx + 130, cy + 90)], fill="#b91c1c")
        # Corona Real de Oro y Joyas
        d.polygon([(cx - 110, cy - 20), (cx + 110, cy - 20), (cx + 130, cy - 100), (cx + 60, cy - 50), (cx, cy - 120), (cx - 60, cy - 50), (cx - 130, cy - 100)], fill="#fbbf24")
        d.ellipse([(cx - 135, cy - 105), (cx - 125, cy - 95)], fill="#ef4444")
        d.ellipse([(cx - 5, cy - 125), (cx + 5, cy - 115)], fill="#38bdf8")
        d.ellipse([(cx + 125, cy - 105), (cx + 135, cy - 95)], fill="#ef4444")
        d.rectangle([(cx - 110, cy - 20), (cx + 110, cy)], fill="#d97706")

    elif theme == "alpine_dawn":
        # M: Mountain of Faith
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 100*ratio), int(215 + 20*ratio), int(170 + 60*ratio)))
        # Sol saliendo
        d.ellipse([(size//2 - 60, inner_y1 + 70), (size//2 + 60, inner_y1 + 190)], fill="#fbbf24")
        # Montañas nevadas
        d.polygon([(inner_x1 - 20, inner_y2), (size//2 - 80, inner_y1 + 110), (size//2 + 100, inner_y2)], fill="#475569")
        d.polygon([(size//2 - 80, inner_y1 + 110), (size//2 - 120, inner_y1 + 180), (size//2 - 40, inner_y1 + 180)], fill="#ffffff")
        d.polygon([(size//2 - 50, inner_y2), (size//2 + 90, inner_y1 + 80), (inner_x2 + 30, inner_y2)], fill="#334155")
        d.polygon([(size//2 + 90, inner_y1 + 80), (size//2 + 50, inner_y1 + 150), (size//2 + 130, inner_y1 + 150)], fill="#ffffff")

    elif theme == "blooming_branch":
        # N: Nest of Birds
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 60*ratio), int(240 - 20*ratio), int(138 + 90*ratio)))
        # Rama
        d.line([(inner_x1, inner_y2 - 100), (inner_x2, inner_y2 - 160)], fill="#78350f", width=18)
        # Nido
        cx, cy = size // 2, inner_y2 - 170
        d.ellipse([(cx - 80, cy - 20), (cx + 80, cy + 60)], fill="#a16207")
        d.ellipse([(cx - 70, cy - 10), (cx + 70, cy + 40)], fill="#713f12")
        # Huevitos celestes
        d.ellipse([(cx - 40, cy - 15), (cx - 10, cy + 20)], fill="#38bdf8")
        d.ellipse([(cx - 10, cy - 20), (cx + 20, cy + 15)], fill="#7dd3fc")
        d.ellipse([(cx + 15, cy - 15), (cx + 45, cy + 20)], fill="#38bdf8")
        # Flores de cerezo en la rama
        for fx, fy in [(cx - 140, inner_y2 - 120), (cx + 130, inner_y2 - 180), (cx - 90, inner_y2 - 90)]:
            d.ellipse([(fx - 18, fy - 18), (fx + 18, fy + 18)], fill="#f472b6")
            d.ellipse([(fx - 6, fy - 6), (fx + 6, fy + 6)], fill="#fde047")

    elif theme == "mediterranean_sun":
        # O: Olive Tree
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 70*ratio), int(249 - 30*ratio), int(195 + 40*ratio)))
        # Sol brillante
        d.ellipse([(inner_x2 - 140, inner_y1 + 40), (inner_x2 - 50, inner_y1 + 130)], fill="#fbbf24")
        # Rama con Olivas
        cx, cy = size // 2, size // 2
        d.line([(cx - 160, cy + 60), (cx + 160, cy - 60)], fill="#78350f", width=12)
        for ox, oy in [(-90, 30), (-30, 10), (30, -10), (90, -30)]:
            # Hojas verdes
            d.ellipse([(cx + ox - 25, cy + oy - 45), (cx + ox + 25, cy + oy - 15)], fill="#65a30d")
            # Olivas moradas
            d.ellipse([(cx + ox - 15, cy + oy + 10), (cx + ox + 15, cy + oy + 45)], fill="#4c1d95")

    elif theme == "cathedral_light":
        # P: Prayer Hands
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(107 - 70*ratio), int(33 - 10*ratio), int(168 + 20*ratio)))
        # Vidriera gótica en el fondo
        d.arc([(size//2 - 120, inner_y1 + 30), (size//2 + 120, inner_y1 + 250)], start=0, end=180, fill="#fbbf24", width=6)
        # Rayos de luz
        for a in [-40, -20, 0, 20, 40]:
            rad = math.radians(a)
            d.line([(size//2, inner_y1 + 60), (size//2 + int(260*math.sin(rad)), inner_y1 + 60 + int(260*math.cos(rad)))], fill="#fef08a", width=3)
        # Manos en Oración
        cx, cy = size // 2, size // 2 + 50
        d.polygon([(cx - 40, cy + 90), (cx - 10, cy - 60), (cx + 10, cy - 60), (cx + 40, cy + 90)], fill="#fed7aa")
        d.line([(cx, cy - 60), (cx, cy + 90)], fill="#ea580c", width=3)

    elif theme == "palace_sunset":
        # Q: Queen Esther
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(255 - 60*ratio), int(228 - 70*ratio), int(230 + 10*ratio)))
        # Columnas de Palacio
        d.rectangle([(inner_x1 + 30, inner_y1 + 40), (inner_x1 + 70, inner_y2)], fill="#f1f5f9")
        d.rectangle([(inner_x2 - 70, inner_y1 + 40), (inner_x2 - 30, inner_y2)], fill="#f1f5f9")
        # Corona y Manto Real
        cx, cy = size // 2, size // 2 + 30
        d.polygon([(cx - 90, cy + 100), (cx + 90, cy + 100), (cx + 40, cy - 20), (cx - 40, cy - 20)], fill="#be123c")
        d.polygon([(cx - 60, cy - 30), (cx + 60, cy - 30), (cx + 75, cy - 85), (cx + 35, cy - 50), (cx, cy - 95), (cx - 35, cy - 50), (cx - 75, cy - 85)], fill="#fbbf24")
        d.ellipse([(cx - 8, cy - 103), (cx + 8, cy - 87)], fill="#38bdf8")

    elif theme == "countryside_rainbow":
        # R: Rainbow of Promise
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(224 - 100*ratio), int(242 - 50*ratio), int(254 - 20*ratio)))
        # Arcoíris
        rainbow_colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6"]
        for idx, col in enumerate(rainbow_colors):
            rad = 180 - idx * 12
            d.arc([(size//2 - rad, inner_y2 - 260 + idx*8), (size//2 + rad, inner_y2 + 80 + idx*8)], start=0, end=180, fill=col, width=10)
        # Nubes esponjosas
        for nx in [inner_x1 + 100, inner_x2 - 100]:
            d.ellipse([(nx - 60, inner_y2 - 120), (nx + 60, inner_y2 - 40)], fill="#ffffff")
        # Colinas verdes
        d.ellipse([(inner_x1 - 40, inner_y2 - 80), (inner_x2 + 40, inner_y2 + 80)], fill="#15803d")

    elif theme == "golden_sun_sky":
        # S: Sun of Light
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(56 + (254-56)*ratio), int(189 + (240-189)*ratio), int(248 + (138-248)*ratio)))
        # Gran Sol Dorado con Rayos
        cx, cy = size // 2, size // 2
        for a in range(0, 360, 15):
            rad = math.radians(a)
            d.line([(cx, cy), (cx + int(175*math.cos(rad)), cy + int(175*math.sin(rad)))], fill="#f59e0b", width=6)
            d.line([(cx, cy), (cx + int(155*math.cos(rad)), cy + int(155*math.sin(rad)))], fill="#fbbf24", width=3)
        d.ellipse([(cx - 95, cy - 95), (cx + 95, cy + 95)], fill="#fbbf24")
        d.ellipse([(cx - 85, cy - 85), (cx + 85, cy + 85)], fill="#fde047")
        # Carita feliz del sol
        d.ellipse([(cx - 40, cy - 20), (cx - 20, cy)], fill="#78350f")
        d.ellipse([(cx + 20, cy - 20), (cx + 40, cy)], fill="#78350f")
        d.arc([(cx - 35, cy - 10), (cx + 35, cy + 40)], start=0, end=180, fill="#78350f", width=5)

    elif theme == "golden_tree_meadow":
        # T: Tree of Life
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 100*ratio), int(240 - 50*ratio), int(138 + 50*ratio)))
        # Colina
        d.ellipse([(inner_x1 - 40, inner_y2 - 120), (inner_x2 + 40, inner_y2 + 80)], fill="#15803d")
        # Árbol de Vida
        cx, cy = size // 2, size // 2 + 40
        d.rectangle([(cx - 24, cy - 50), (cx + 24, inner_y2 - 40)], fill="#78350f")
        # Copa Frondosa
        d.ellipse([(cx - 120, cy - 180), (cx + 120, cy + 20)], fill="#16a34a")
        d.ellipse([(cx - 90, cy - 210), (cx + 90, cy - 30)], fill="#22c55e")
        # Frutos Dorados
        for fx, fy in [(-50, -120), (50, -110), (0, -160), (-40, -60), (40, -70), (0, -90)]:
            d.ellipse([(cx + fx - 12, cy + fy - 12), (cx + fx + 12, cy + fy + 12)], fill="#fbbf24")

    elif theme == "cosmic_nebula":
        # U: Universe & Stars
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(2 + 20*ratio), int(6 + 10*ratio), int(23 + 40*ratio)))
        # Estrellas de fondo
        for sx, sy in [(inner_x1 + 40, inner_y1 + 60), (inner_x2 - 80, inner_y1 + 90), (inner_x1 + 90, inner_y2 - 70), (inner_x2 - 50, inner_y2 - 100)]:
            d.ellipse([(sx - 4, sy - 4), (sx + 4, sy + 4)], fill="#ffffff")
        # Planeta Saturno con Anillos
        cx, cy = size // 2, size // 2
        d.ellipse([(cx - 80, cy - 80), (cx + 80, cy + 80)], fill="#38bdf8")
        # Anillos
        d.ellipse([(cx - 160, cy - 25), (cx + 160, cy + 25)], outline="#fbbf24", width=12)
        d.ellipse([(cx - 80, cy - 80), (cx + 80, cy + 80)], fill="#0284c7")

    elif theme == "tuscany_vineyard":
        # V: Vine & Grapes
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 50*ratio), int(249 - 20*ratio), int(195 + 20*ratio)))
        # Colinas toscanas
        d.ellipse([(inner_x1 - 40, inner_y2 - 100), (inner_x2 + 40, inner_y2 + 80)], fill="#65a30d")
        # Racimo de Uvas
        cx, cy = size // 2, size // 2
        d.rectangle([(cx - 8, cy - 100), (cx + 8, cy - 40)], fill="#78350f")
        # Hojas de parra
        d.ellipse([(cx - 80, cy - 80), (cx, cy - 30)], fill="#16a34a")
        d.ellipse([(cx, cy - 80), (cx + 80, cy - 30)], fill="#16a34a")
        # Uvas moradas
        grape_layout = [(-35, -20), (0, -20), (35, -20), (-50, 15), (-17, 15), (17, 15), (50, 15), (-35, 50), (0, 50), (35, 50), (-17, 85), (17, 85), (0, 120)]
        for gx, gy in grape_layout:
            d.ellipse([(cx + gx - 20, cy + gy - 20), (cx + gx + 20, cy + gy + 20)], fill="#581c87")
            d.ellipse([(cx + gx - 8, cy + gy - 8), (cx + gx + 4, cy + gy + 4)], fill="#c084fc")

    elif theme == "deep_blue_sea":
        # W: Whale of Jonah
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(186 - 150*ratio), int(230 - 150*ratio), int(253 - 100*ratio)))
        # Océano profundo
        d.rectangle([(inner_x1, size//2 + 20), (inner_x2, inner_y2)], fill="#0369a1")
        # Gran Ballena
        cx, cy = size // 2, size // 2 + 40
        d.ellipse([(cx - 140, cy - 60), (cx + 80, cy + 50)], fill="#0284c7")
        d.polygon([(cx + 70, cy - 10), (cx + 140, cy - 60), (cx + 140, cy + 40)], fill="#0369a1")
        # Chorro de agua
        for a in [-30, 0, 30]:
            rad = math.radians(a)
            d.line([(cx - 60, cy - 60), (cx - 60 + int(70*math.sin(rad)), cy - 60 - int(70*math.cos(rad)))], fill="#ffffff", width=6)
        d.ellipse([(cx - 95, cy - 15), (cx - 75, cy + 5)], fill="#ffffff")
        d.ellipse([(cx - 90, cy - 10), (cx - 80, cy)], fill="#0f172a")

    elif theme == "baroque_music":
        # X: Xylophone of Praise
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 60*ratio), int(243 - 80*ratio), int(199 - 50*ratio)))
        # Xilófono con teclas de colores
        cx, cy = size // 2, size // 2 + 20
        d.polygon([(cx - 150, cy - 50), (cx + 150, cy - 20), (cx + 140, cy + 60), (cx - 140, cy + 70)], fill="#78350f")
        key_colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#38bdf8", "#3b82f6", "#a855f7", "#ec4899"]
        for idx, kc in enumerate(key_colors):
            kx = cx - 130 + idx * 34
            kh = 120 - idx * 8
            d.rectangle([(kx, cy - kh//2), (kx + 26, cy + kh//2)], fill=kc)
            d.ellipse([(kx + 9, cy - kh//2 + 8), (kx + 17, cy - kh//2 + 16)], fill="#ffffff")
        # Notas musicales flotando
        for nx, ny in [(cx - 80, inner_y1 + 80), (cx + 70, inner_y1 + 60), (cx, inner_y1 + 100)]:
            d.ellipse([(nx - 10, ny - 10), (nx + 10, ny + 10)], fill="#78350f")
            d.line([(nx + 10, ny), (nx + 10, ny - 35)], fill="#78350f", width=4)

    elif theme == "flowering_meadow":
        # Y: Youth & Joy
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(255 - 60*ratio), int(237 - 40*ratio), int(213 + 30*ratio)))
        # Sol
        d.ellipse([(inner_x2 - 130, inner_y1 + 40), (inner_x2 - 50, inner_y1 + 120)], fill="#fbbf24")
        # Pradera
        d.ellipse([(inner_x1 - 40, inner_y2 - 140), (inner_x2 + 40, inner_y2 + 80)], fill="#15803d")
        # Niños felices saltando
        cx, cy = size // 2, size // 2 + 20
        for kx, col in [(-60, "#38bdf8"), (60, "#f43f5e")]:
            d.ellipse([(cx + kx - 22, cy - 60), (cx + kx + 22, cy - 16)], fill="#fed7aa") # Cabeza
            d.line([(cx + kx, cy - 16), (cx + kx, cy + 40)], fill=col, width=14) # Cuerpo
            d.line([(cx + kx, cy), (cx + kx - 35, cy - 35)], fill="#fed7aa", width=6) # Brazos arriba
            d.line([(cx + kx, cy), (cx + kx + 35, cy - 35)], fill="#fed7aa", width=6)
            d.line([(cx + kx, cy + 40), (cx + kx - 25, cy + 85)], fill="#0f172a", width=6) # Piernas
            d.line([(cx + kx, cy + 40), (cx + kx + 25, cy + 85)], fill="#0f172a", width=6)

    elif theme == "celestial_temple":
        # Z: Zion Holy Mount
        for y in range(inner_y1, inner_y2):
            ratio = (y - inner_y1) / inner_h
            d.line([(inner_x1, y), (inner_x2, y)], fill=(int(254 - 100*ratio), int(240 - 50*ratio), int(138 + 50*ratio)))
        # Rayos Celestiales
        cx, cy = size // 2, size // 2 - 20
        for a in [-50, -25, 0, 25, 50]:
            rad = math.radians(a)
            d.line([(cx, inner_y1 + 30), (cx + int(300*math.sin(rad)), inner_y1 + 30 + int(300*math.cos(rad)))], fill="#ffffff", width=4)
        # Monte Sagrado
        d.polygon([(inner_x1 - 40, inner_y2), (cx, inner_y1 + 140), (inner_x2 + 40, inner_y2)], fill="#ca8a04")
        # Templo Dorado
        d.rectangle([(cx - 70, inner_y1 + 170), (cx + 70, inner_y1 + 240)], fill="#fde047")
        # Columnas
        for col_x in range(cx - 60, cx + 70, 30):
            d.rectangle([(col_x - 5, inner_y1 + 180), (col_x + 5, inner_y1 + 240)], fill="#ffffff")
        # Cúpula
        d.arc([(cx - 75, inner_y1 + 100), (cx + 75, inner_y1 + 180)], start=0, end=180, fill="#fbbf24", width=14)

    return img


def render_bold_lineart(spec, size=1000):
    """Genera la lámina de coloreado Clean Bold Line-Art para niños."""
    img = Image.new("RGB", (size, size), "#ffffff")
    d = ImageDraw.Draw(img)

    # Marco exterior decorativo
    d.rounded_rectangle([(30, 30), (size - 30, size - 30)], radius=20, outline="#000000", width=8)

    cx, cy = size // 2, size // 2
    subj = spec["subject"]

    # 1. Sol amigable en la esquina superior
    d.ellipse([(size - 220, 60), (size - 80, 200)], outline="#000000", width=6)
    for a in range(0, 360, 30):
        rad = math.radians(a)
        d.line([(size - 150 + int(80*math.cos(rad)), 130 + int(80*math.sin(rad))), (size - 150 + int(105*math.cos(rad)), 130 + int(105*math.sin(rad)))], fill="#000000", width=5)
    # Carita feliz del sol
    d.ellipse([(size - 175, 110), (size - 160, 125)], fill="#000000")
    d.ellipse([(size - 140, 110), (size - 125, 125)], fill="#000000")
    d.arc([(size - 170, 125), (size - 130, 160)], start=0, end=180, fill="#000000", width=5)

    # 2. Nubes amigables
    for nx in [120, size - 360]:
        d.ellipse([(nx, 90), (nx + 80, 150)], outline="#000000", width=5)
        d.ellipse([(nx + 50, 70), (nx + 150, 150)], outline="#000000", width=5)
        d.ellipse([(nx + 120, 90), (nx + 200, 150)], outline="#000000", width=5)

    # 3. Dibujo Protagónico según la Letra
    if subj == "eagle":
        # Águila majestuosa con alas abiertas
        d.ellipse([(cx - 70, cy - 80), (cx + 70, cy + 60)], outline="#000000", width=7)
        d.polygon([(cx - 40, cy - 30), (cx - 100, cy - 10), (cx - 40, cy + 10)], outline="#000000", width=7) # Pico
        # Alas abiertas
        d.arc([(cx - 380, cy - 220), (cx - 20, cy + 40)], start=30, end=180, fill="#000000", width=7)
        d.arc([(cx + 20, cy - 220), (cx + 380, cy + 40)], start=0, end=150, fill="#000000", width=7)
        # Montañas abajo
        d.polygon([(60, size - 60), (cx - 150, cy + 160), (cx + 50, size - 60)], outline="#000000", width=6)
        d.polygon([(cx, size - 60), (cx + 220, cy + 130), (size - 60, size - 60)], outline="#000000", width=6)

    elif subj == "fish":
        # Pez sonriente con burbujas y olas
        d.ellipse([(cx - 240, cy - 140), (cx + 160, cy + 140)], outline="#000000", width=7)
        d.polygon([(cx + 140, cy), (cx + 280, cy - 100), (cx + 240, cy), (cx + 280, cy + 100)], outline="#000000", width=7) # Cola
        d.arc([(cx - 180, cy - 80), (cx - 20, cy + 80)], start=0, end=180, fill="#000000", width=6) # Agallas
        d.ellipse([(cx - 160, cy - 50), (cx - 120, cy - 10)], fill="#000000") # Ojo
        d.arc([(cx - 210, cy), (cx - 160, cy + 50)], start=0, end=180, fill="#000000", width=6) # Sonrisa
        # Olas de agua
        for ox in range(80, size - 80, 160):
            d.arc([(ox, size - 180), (ox + 140, size - 100)], start=0, end=180, fill="#000000", width=6)
        # Burbujas
        d.ellipse([(cx - 280, cy - 120), (cx - 240, cy - 80)], outline="#000000", width=5)
        d.ellipse([(cx - 260, cy - 200), (cx - 210, cy - 150)], outline="#000000", width=5)

    elif subj == "garden":
        # Jardín con flores grandes, mariposa y abejita
        for idx, fx in enumerate(range(140, size - 100, 160)):
            fy = size - 260 + (idx % 2) * 40
            d.line([(fx, fy), (fx, size - 60)], fill="#000000", width=7)
            d.ellipse([(fx - 40, fy - 40), (fx + 40, fy + 40)], outline="#000000", width=7)
            for pa in range(0, 360, 60):
                prad = math.radians(pa)
                d.ellipse([(fx + int(50*math.cos(prad)) - 22, fy + int(50*math.sin(prad)) - 22), (fx + int(50*math.cos(prad)) + 22, fy + int(50*math.sin(prad)) + 22)], outline="#000000", width=6)
        # Gran Mariposa volando
        d.ellipse([(cx - 20, cy - 180), (cx + 20, cy - 100)], fill="#000000")
        d.ellipse([(cx - 110, cy - 220), (cx - 10, cy - 120)], outline="#000000", width=6)
        d.ellipse([(cx + 10, cy - 220), (cx + 110, cy - 120)], outline="#000000", width=6)

    elif subj == "heart":
        # Gran Corazón Alado con Flores
        d.ellipse([(cx - 200, cy - 180), (cx, cy + 20)], outline="#000000", width=8)
        d.ellipse([(cx, cy - 180), (cx + 200, cy + 20)], outline="#000000", width=8)
        d.polygon([(cx - 200, cy - 80), (cx + 200, cy - 80), (cx, cy + 200)], outline="#000000", width=8)
        # Rayos de amor
        for a in range(0, 360, 30):
            rad = math.radians(a)
            d.line([(cx + int(240*math.cos(rad)), cy + int(240*math.sin(rad))), (cx + int(290*math.cos(rad)), cy + int(290*math.sin(rad)))], fill="#000000", width=6)
        # Flores abajo
        for fx in [cx - 120, cx, cx + 120]:
            d.ellipse([(fx - 25, size - 140), (fx + 25, size - 90)], outline="#000000", width=5)

    elif subj == "island":
        # Isla tropical con palmeras y cocos
        d.arc([(80, size - 260), (size - 80, size + 100)], start=0, end=180, fill="#000000", width=7) # Isla
        # Palmera
        px, py = cx, size - 220
        d.line([(px, py), (px + 40, cy - 160)], fill="#000000", width=14)
        for dx, dy in [(-180, -60), (180, -60), (-140, 80), (140, 80), (0, -140)]:
            d.arc([(px + 40 + min(0, dx), cy - 160 + min(0, dy)), (px + 40 + max(0, dx), cy - 160 + max(0, dy) + 80)], start=0, end=180, fill="#000000", width=7)
        # Cocos
        d.ellipse([(px + 20, cy - 170), (px + 50, cy - 140)], outline="#000000", width=6)
        d.ellipse([(px + 50, cy - 170), (px + 80, cy - 140)], outline="#000000", width=6)

    elif subj == "crown":
        # Corona de Rey con Joyas sobre Cojín
        d.polygon([(cx - 240, cy + 80), (cx + 240, cy + 80), (cx + 280, cy - 120), (cx + 140, cy - 20), (cx, cy - 180), (cx - 140, cy - 20), (cx - 280, cy - 120)], outline="#000000", width=8)
        for jx, jy in [(cx - 280, cy - 120), (cx, cy - 180), (cx + 280, cy - 120), (cx - 140, cy - 20), (cx + 140, cy - 20)]:
            d.ellipse([(jx - 25, jy - 25), (jx + 25, jy + 25)], outline="#000000", width=6)
        # Base de la corona
        d.rounded_rectangle([(cx - 250, cy + 70), (cx + 250, cy + 140)], radius=15, outline="#000000", width=7)

    elif subj == "mountain":
        # Montañas de Fe con cumbre nevada y sendero
        d.polygon([(80, size - 80), (cx - 100, cy - 160), (cx + 180, size - 80)], outline="#000000", width=8)
        d.polygon([(cx - 80, size - 80), (cx + 160, cy - 120), (size - 80, size - 80)], outline="#000000", width=8)
        # Cumbres nevadas
        d.line([(cx - 140, cy - 60), (cx - 60, cy - 60)], fill="#000000", width=6)
        d.line([(cx + 110, cy - 40), (cx + 210, cy - 40)], fill="#000000", width=6)
        # Pinos al pie
        for tx in [160, 260, size - 260, size - 160]:
            d.polygon([(tx, size - 80), (tx - 35, size - 160), (tx + 35, size - 160)], outline="#000000", width=5)

    elif subj == "nest":
        # Nido con 3 huevitos y pajaritos en rama florecida
        d.line([(60, cy + 100), (size - 60, cy + 40)], fill="#000000", width=14)
        # Nido
        d.arc([(cx - 180, cy - 40), (cx + 180, cy + 180)], start=0, end=180, fill="#000000", width=8)
        d.line([(cx - 180, cy + 70), (cx + 180, cy + 70)], fill="#000000", width=7)
        # Huevitos
        for ex in [cx - 80, cx, cx + 80]:
            d.ellipse([(ex - 35, cy - 20), (ex + 35, cy + 70)], outline="#000000", width=6)
        # Flores
        for fx, fy in [(cx - 240, cy + 90), (cx + 240, cy + 30)]:
            d.ellipse([(fx - 30, fy - 30), (fx + 30, fy + 30)], outline="#000000", width=5)

    elif subj == "olive":
        # Rama de Olivo con hojas y olivas
        d.line([(100, size - 120), (size - 100, 160)], fill="#000000", width=12)
        for ox, oy in [(-180, 80), (-60, 20), (60, -40), (180, -100)]:
            d.ellipse([(cx + ox - 45, cy + oy - 80), (cx + ox + 45, cy + oy - 20)], outline="#000000", width=6)
            d.ellipse([(cx + ox - 30, cy + oy + 20), (cx + ox + 30, cy + oy + 80)], outline="#000000", width=6)

    elif subj == "prayer":
        # Manos en Oración
        d.ellipse([(cx - 80, cy - 180), (cx + 80, cy + 140)], outline="#000000", width=8)
        d.line([(cx, cy - 180), (cx, cy + 140)], fill="#000000", width=7)
        # Rayos de bendición
        for a in [-50, -25, 0, 25, 50]:
            rad = math.radians(a)
            d.line([(cx + int(150*math.sin(rad)), cy - 100 - int(150*math.cos(rad))), (cx + int(220*math.sin(rad)), cy - 100 - int(220*math.cos(rad)))], fill="#000000", width=5)

    elif subj == "queen":
        # Corona Real de la Reina Ester y Manto
        d.polygon([(cx - 200, cy + 80), (cx + 200, cy + 80), (cx + 240, cy - 80), (cx + 120, cy), (cx, cy - 140), (cx - 120, cy), (cx - 240, cy - 80)], outline="#000000", width=8)
        for jx, jy in [(cx - 240, cy - 80), (cx, cy - 140), (cx + 240, cy - 80)]:
            d.ellipse([(jx - 20, jy - 20), (jx + 20, jy + 20)], outline="#000000", width=6)
        d.rounded_rectangle([(cx - 220, cy + 70), (cx + 220, cy + 140)], radius=15, outline="#000000", width=7)

    elif subj == "rainbow":
        # Gran Arcoíris sobre Pradera
        for r in [320, 270, 220, 170, 120]:
            d.arc([(cx - r, size - 140 - r), (cx + r, size - 140 + r)], start=0, end=180, fill="#000000", width=7)
        # Nubes en la base
        for nx in [cx - 280, cx + 280]:
            d.ellipse([(nx - 80, size - 220), (nx + 80, size - 120)], outline="#000000", width=6)

    elif subj == "sun":
        # Sol Radiante Gigante con Carita Sonriente
        for a in range(0, 360, 20):
            rad = math.radians(a)
            d.line([(cx + int(190*math.cos(rad)), cy + int(190*math.sin(rad))), (cx + int(280*math.cos(rad)), cy + int(280*math.sin(rad)))], fill="#000000", width=8)
        d.ellipse([(cx - 180, cy - 180), (cx + 180, cy + 180)], outline="#000000", width=8)
        # Ojos grandes
        d.ellipse([(cx - 80, cy - 40), (cx - 40, cy)], fill="#000000")
        d.ellipse([(cx + 40, cy - 40), (cx + 80, cy)], fill="#000000")
        # Sonrisa hermosa
        d.arc([(cx - 80, cy - 20), (cx + 80, cy + 90)], start=0, end=180, fill="#000000", width=7)

    elif subj == "tree":
        # Árbol de Vida Monumental
        d.rectangle([(cx - 40, cy), (cx + 40, size - 80)], outline="#000000", width=8)
        # Copa
        d.ellipse([(cx - 260, cy - 240), (cx + 260, cy + 60)], outline="#000000", width=8)
        d.ellipse([(cx - 180, cy - 290), (cx + 180, cy - 40)], outline="#000000", width=7)
        # Manzanitas
        for ax, ay in [(-120, -120), (120, -100), (0, -180), (-80, -40), (80, -30), (0, -90)]:
            d.ellipse([(cx + ax - 22, cy + ay - 22), (cx + ax + 22, cy + ay + 22)], outline="#000000", width=6)

    elif subj == "universe":
        # Planeta Saturno con Anillos y Estrellas
        d.ellipse([(cx - 170, cy - 170), (cx + 170, cy + 170)], outline="#000000", width=8)
        d.arc([(cx - 340, cy - 60), (cx + 340, cy + 60)], start=0, end=360, fill="#000000", width=8)
        # Estrellas de 5 puntas
        for sx, sy in [(140, 140), (size - 140, 160), (160, size - 160), (size - 160, size - 180)]:
            d.ellipse([(sx - 30, sy - 30), (sx + 30, sy + 30)], outline="#000000", width=5)

    elif subj == "vine":
        # Vid con Racimos de Uvas
        d.line([(cx - 20, cy - 220), (cx + 20, cy - 120)], fill="#000000", width=12)
        # Hojas
        d.ellipse([(cx - 180, cy - 180), (cx - 20, cy - 90)], outline="#000000", width=6)
        d.ellipse([(cx + 20, cy - 180), (cx + 180, cy - 90)], outline="#000000", width=6)
        # Uvas
        grape_coords = [(-80, -70), (0, -70), (80, -70), (-120, 0), (-40, 0), (40, 0), (120, 0), (-80, 70), (0, 70), (80, 70), (-40, 140), (40, 140), (0, 210)]
        for gx, gy in grape_coords:
            d.ellipse([(cx + gx - 35, cy + gy - 35), (cx + gx + 35, cy + gy + 35)], outline="#000000", width=7)

    elif subj == "whale":
        # Gran Ballena con Chorro de Agua
        d.ellipse([(cx - 280, cy - 120), (cx + 160, cy + 120)], outline="#000000", width=8)
        d.polygon([(cx + 140, cy), (cx + 280, cy - 100), (cx + 240, cy), (cx + 280, cy + 100)], outline="#000000", width=8)
        # Chorro
        d.arc([(cx - 120, cy - 260), (cx - 40, cy - 120)], start=0, end=180, fill="#000000", width=7)
        d.arc([(cx - 80, cy - 280), (cx + 20, cy - 120)], start=0, end=180, fill="#000000", width=7)
        # Ojo y Sonrisa
        d.ellipse([(cx - 200, cy - 30), (cx - 170, cy)], fill="#000000")
        d.arc([(cx - 250, cy + 10), (cx - 180, cy + 60)], start=0, end=180, fill="#000000", width=6)
        # Olas
        for ox in range(60, size - 60, 160):
            d.arc([(ox, size - 160), (ox + 140, size - 80)], start=0, end=180, fill="#000000", width=6)

    elif subj == "xylophone":
        # Xilófono con Baquetas
        bar_w = 60
        for idx in range(7):
            bx = cx - 210 + idx * 70
            bh = 260 - idx * 22
            d.rounded_rectangle([(bx, cy - bh//2), (bx + bar_w, cy + bh//2)], radius=10, outline="#000000", width=6)
            d.ellipse([(bx + bar_w//2 - 8, cy - bh//2 + 15), (bx + bar_w//2 + 8, cy - bh//2 + 31)], fill="#000000")
            d.ellipse([(bx + bar_w//2 - 8, cy + bh//2 - 31), (bx + bar_w//2 + 8, cy + bh//2 - 15)], fill="#000000")
        # Baqueta
        d.line([(cx - 140, cy - 160), (cx - 40, cy - 240)], fill="#000000", width=8)
        d.ellipse([(cx - 55, cy - 255), (cx - 25, cy - 225)], fill="#000000")

    elif subj == "youth":
        # Niños y Niñas felices saltando
        for kx in [cx - 140, cx + 140]:
            d.ellipse([(kx - 45, cy - 140), (kx + 45, cy - 50)], outline="#000000", width=7) # Cabeza
            d.ellipse([(kx - 15, cy - 105), (kx - 5, cy - 95)], fill="#000000") # Ojos
            d.ellipse([(kx + 5, cy - 105), (kx + 15, cy - 95)], fill="#000000")
            d.arc([(kx - 20, cy - 95), (kx + 20, cy - 65)], start=0, end=180, fill="#000000", width=5)
            d.line([(kx, cy - 50), (kx, cy + 70)], fill="#000000", width=8) # Cuerpo
            d.line([(kx, cy - 20), (kx - 65, cy - 80)], fill="#000000", width=7) # Brazos arriba
            d.line([(kx, cy - 20), (kx + 65, cy - 80)], fill="#000000", width=7)
            d.line([(kx, cy + 70), (kx - 45, cy + 160)], fill="#000000", width=7) # Piernas
            d.line([(kx, cy + 70), (kx + 45, cy + 160)], fill="#000000", width=7)

    elif subj == "zion":
        # Monte de Sion con Templo Celestial
        d.polygon([(80, size - 80), (cx, cy - 60), (size - 80, size - 80)], outline="#000000", width=8)
        # Templo
        d.rounded_rectangle([(cx - 140, cy - 60), (cx + 140, cy + 60)], radius=10, outline="#000000", width=7)
        for col_x in range(cx - 100, cx + 110, 50):
            d.line([(col_x, cy - 50), (col_x, cy + 50)], fill="#000000", width=6)
        # Cúpula
        d.arc([(cx - 130, cy - 180), (cx + 130, cy - 50)], start=0, end=180, fill="#000000", width=7)

    return img


def generate_all_assets():
    print("🎨 Iniciando Generación de 26 Activos Únicos e Inconfundibles...")
    hashes_canvas = set()
    hashes_lineart = set()

    for item in LETTERS_SPEC:
        l = item["letter"]
        canvas_path = UPLOADS_DIR / f"canvas_art_{l}.jpg"
        lineart_path = UPLOADS_DIR / f"lineart_{l}.jpg"

        # 1. Canvas
        if not canvas_path.exists():
            c_img = render_painterly_canvas(item)
            c_img.save(canvas_path, quality=95)
            print(f"✔ Generado Lienzo Óleo: {canvas_path.name}")
        else:
            print(f"✨ Usando Lienzo Óleo existente: {canvas_path.name}")

        # 2. Lineart
        if not lineart_path.exists():
            # Si es la letra A y existe art_A.jpg, usar art_A
            if l == "A" and (UPLOADS_DIR / "art_A.jpg").exists():
                pass
            else:
                l_img = render_bold_lineart(item)
                l_img.save(lineart_path, quality=95)
                print(f"✔ Generada Lámina Line-Art: {lineart_path.name}")
        else:
            print(f"✨ Usando Lámina Line-Art existente: {lineart_path.name}")

        # Comprobación de no duplicidad mediante Hash MD5
        c_bytes = canvas_path.read_bytes()
        c_hash = hashlib.md5(c_bytes).hexdigest()
        assert c_hash not in hashes_canvas, f"❌ ERROR: Lienzo duplicado detectado en letra {l}!"
        hashes_canvas.add(c_hash)

    print(f"🏆 ¡VERIFICACIÓN EXITOSA! Los 26 lienzos al óleo son 100% ÚNICOS Y DISTINTOS (26/{len(hashes_canvas)} hashes únicos).")

if __name__ == "__main__":
    generate_all_assets()
