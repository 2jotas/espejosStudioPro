"""
Compilador y Generador de Fichas Maestras Bilingües (English Primary + Subtítulo Español)
Cada ficha incluye:
- Header: Palabra en Inglés en grande + Subtítulo en Español
- Lienzo al Óleo de Época en Miniatura con Marco Dorado
- Lámina para Colorear Clean Bold Line-Art para niños
- Pauta de Caligrafía Punteada Bilingüe
- Versículo Bíblico en Inglés (empieza por la letra) + Traducción al Español
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from PIL import Image, ImageDraw

UPLOADS_DIR = Path("/app/workspace/apps/api/uploads")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

BILINGUAL_ALPHABET = [
    {
        "letter": "A",
        "word_en": "Ark of Noah",
        "word_es": "Arca de Noé",
        "artist": "William Turner (Maritime Oil)",
        "verse_en": "All scripture is given by inspiration of God. — 2 Timothy 3:16",
        "verse_es": "Toda la Escritura es inspirada por Dios.",
        "canvas": "canvas_art_A.jpg",
        "lineart": "art_A.jpg"
    },
    {
        "letter": "B",
        "word_en": "Bible of Truth",
        "word_es": "Biblia Sagrada",
        "artist": "Rembrandt (Golden Chiaroscuro)",
        "verse_en": "Blessed are the pure in heart: for they shall see God. — Matthew 5:8",
        "verse_es": "Bienaventurados los de limpio corazón, pues ellos verán a Dios.",
        "canvas": "canvas_art_B.jpg",
        "lineart": "lineart_B.jpg"
    },
    {
        "letter": "C",
        "word_en": "Cross of Grace",
        "word_es": "Cruz de Gracia",
        "artist": "Claude Monet (Poppy Hillside)",
        "verse_en": "Create in me a clean heart, O God; and renew a right spirit. — Psalm 51:10",
        "verse_es": "Crea en mí, oh Dios, un corazón limpio y renueva mi espíritu.",
        "canvas": "canvas_art_C.jpg",
        "lineart": "lineart_C.jpg"
    },
    {
        "letter": "D",
        "word_en": "Dove of Peace",
        "word_es": "Paloma de la Paz",
        "artist": "Vincent van Gogh (Starry Sky)",
        "verse_en": "Draw near to God, and he will draw near to you. — James 4:8",
        "verse_es": "Acercaos a Dios, y él se acercará a vosotros.",
        "canvas": "canvas_art_D.jpg",
        "lineart": "lineart_D.jpg"
    },
    {
        "letter": "E",
        "word_en": "Eagle in Sky",
        "word_es": "Águila Majestuosa",
        "artist": "Albert Bierstadt (Alpine Sunrise)",
        "verse_en": "Every good gift and every perfect gift is from above. — James 1:17",
        "verse_es": "Toda buena dádiva y todo don perfecto desciende de lo alto.",
        "canvas": "canvas_art_E.jpg",
        "lineart": "lineart_E.jpg"
    },
    {
        "letter": "F",
        "word_en": "Fish of Galilee",
        "word_es": "Peces del Mar",
        "artist": "Joaquín Sorolla (Sea Luminism)",
        "verse_en": "Fear thou not; for I am with thee: be not dismayed. — Isaiah 41:10",
        "verse_es": "No temas, porque yo estoy contigo; no desmayes.",
        "canvas": "canvas_art_F.jpg",
        "lineart": "lineart_F.jpg"
    },
    {
        "letter": "G",
        "word_en": "Garden of Eden",
        "word_es": "Jardín Florido",
        "artist": "Claude Monet (Giverny Garden)",
        "verse_en": "God is our refuge and strength, a very present help. — Psalm 46:1",
        "verse_es": "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio.",
        "canvas": "canvas_art_G.jpg",
        "lineart": "lineart_G.jpg"
    },
    {
        "letter": "H",
        "word_en": "Heart of Love",
        "word_es": "Corazón de Amor",
        "artist": "William Blake (Celestial Radiance)",
        "verse_en": "He healeth the broken in heart, and bindeth up their wounds. — Psalm 147:3",
        "verse_es": "Él sana a los quebrantados de corazón y venda sus heridas.",
        "canvas": "canvas_art_H.jpg",
        "lineart": "lineart_H.jpg"
    },
    {
        "letter": "I",
        "word_en": "Island in Ocean",
        "word_es": "Isla Tropical",
        "artist": "Paul Gauguin (Turquoise Lagoon)",
        "verse_en": "I can do all things through Christ which strengtheneth me. — Philippians 4:13",
        "verse_es": "Todo lo puedo en Cristo que me fortalece.",
        "canvas": "canvas_art_I.jpg",
        "lineart": "lineart_I.jpg"
    },
    {
        "letter": "J",
        "word_en": "Jesus Good Shepherd",
        "word_es": "Jesús Buen Pastor",
        "artist": "Raphael (Classical Pastoral)",
        "verse_en": "Jesus saith unto him, I am the way, the truth, and the life. — John 14:6",
        "verse_es": "Jesús le dijo: Yo soy el camino, y la verdad, y la vida.",
        "canvas": "canvas_art_J.jpg",
        "lineart": "lineart_J.jpg"
    },
    {
        "letter": "K",
        "word_en": "King's Crown",
        "word_es": "Corona de Rey",
        "artist": "Diego Velázquez (Royal Splendor)",
        "verse_en": "Know ye that the Lord he is God: it is he that hath made us. — Psalm 100:3",
        "verse_es": "Reconoced que el Señor es Dios; él nos hizo y no nosotros mismos.",
        "canvas": "canvas_art_K.jpg",
        "lineart": "lineart_K.jpg"
    },
    {
        "letter": "L",
        "word_en": "Lion of Judah",
        "word_es": "León de Judá",
        "artist": "Eugène Delacroix (Savanna Sunset)",
        "verse_en": "Thy word is a lamp unto my feet, and a light unto my path. — Psalm 119:105",
        "verse_es": "Lámpara es a mis pies tu palabra, y lumbrera a mi camino.",
        "canvas": "canvas_art_L.jpg",
        "lineart": "lineart_L.jpg"
    },
    {
        "letter": "M",
        "word_en": "Mountain of Faith",
        "word_es": "Montaña de Fe",
        "artist": "Caspar D. Friedrich (Alpine Dawn)",
        "verse_en": "My help cometh from the Lord, which made heaven and earth. — Psalm 121:2",
        "verse_es": "Mi socorro viene del Señor, que hizo los cielos y la tierra.",
        "canvas": "canvas_art_M.jpg",
        "lineart": "lineart_M.jpg"
    },
    {
        "letter": "N",
        "word_en": "Nest of Birds",
        "word_es": "Nido de Aves",
        "artist": "John J. Audubon (Botanical Art)",
        "verse_en": "Now faith is the substance of things hoped for. — Hebrews 11:1",
        "verse_es": "Es, pues, la fe la certeza de lo que se espera.",
        "canvas": "canvas_art_N.jpg",
        "lineart": "lineart_N.jpg"
    },
    {
        "letter": "O",
        "word_en": "Olive Tree",
        "word_es": "Rama de Olivo",
        "artist": "Vincent van Gogh (Sunny Olive Grove)",
        "verse_en": "O give thanks unto the Lord; for he is good: his mercy endureth for ever. — Psalm 107:1",
        "verse_es": "Alabad al Señor, porque él es bueno; para siempre es su misericordia.",
        "canvas": "canvas_art_O.jpg",
        "lineart": "lineart_O.jpg"
    },
    {
        "letter": "P",
        "word_en": "Prayer Hands",
        "word_es": "Manos en Oración",
        "artist": "Albrecht Dürer (Cathedral Light)",
        "verse_en": "Pray without ceasing. In every thing give thanks. — 1 Thessalonians 5:17",
        "verse_es": "Orad sin cesar. Dad gracias en todo.",
        "canvas": "canvas_art_P.jpg",
        "lineart": "lineart_P.jpg"
    },
    {
        "letter": "Q",
        "word_en": "Queen Esther",
        "word_es": "Reina Valiente",
        "artist": "John W. Waterhouse (Pre-Raphaelite)",
        "verse_en": "Quietly wait for the salvation of the Lord. — Lamentations 3:26",
        "verse_es": "Bueno es esperar en silencio la salvación del Señor.",
        "canvas": "canvas_art_Q.jpg",
        "lineart": "lineart_Q.jpg"
    },
    {
        "letter": "R",
        "word_en": "Rainbow of Promise",
        "word_es": "Arcoíris de Promesa",
        "artist": "John Constable (Countryside Rainbow)",
        "verse_en": "Rejoice in the Lord alway: and again I say, Rejoice. — Philippians 4:4",
        "verse_es": "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos!",
        "canvas": "canvas_art_R.jpg",
        "lineart": "lineart_R.jpg"
    },
    {
        "letter": "S",
        "word_en": "Sun of Light",
        "word_es": "Sol Radiante",
        "artist": "Joaquín Sorolla (Golden Sun Sky)",
        "verse_en": "Seek ye the Lord while he may be found, call upon him. — Isaiah 55:6",
        "verse_es": "Buscad al Señor mientras puede ser hallado, llamadle en tanto que está cercano.",
        "canvas": "canvas_art_S.jpg",
        "lineart": "lineart_S.jpg"
    },
    {
        "letter": "T",
        "word_en": "Tree of Life",
        "word_es": "Árbol de Vida",
        "artist": "Gustav Klimt (Golden Tree)",
        "verse_en": "Trust in the Lord with all thine heart; and lean not unto thine own understanding. — Proverbs 3:5",
        "verse_es": "Confía en el Señor con todo tu corazón, y no te apoyes en tu propia prudencia.",
        "canvas": "canvas_art_T.jpg",
        "lineart": "lineart_T.jpg"
    },
    {
        "letter": "U",
        "word_en": "Universe & Stars",
        "word_es": "Universo y Cosmos",
        "artist": "19th Century Celestial Cartography",
        "verse_en": "Unto thee, O Lord, do I lift up my soul. — Psalm 25:1",
        "verse_es": "A ti, oh Señor, levantaré mi alma.",
        "canvas": "canvas_art_U.jpg",
        "lineart": "lineart_U.jpg"
    },
    {
        "letter": "V",
        "word_en": "Vine & Grapes",
        "word_es": "Vid y Racimos",
        "artist": "Caravaggio (Tuscan Vineyard)",
        "verse_en": "Verily, verily, I say unto you, He that believeth on me hath everlasting life. — John 6:47",
        "verse_es": "De cierto, de cierto os digo: El que cree en mí, tiene vida eterna.",
        "canvas": "canvas_art_V.jpg",
        "lineart": "lineart_V.jpg"
    },
    {
        "letter": "W",
        "word_en": "Whale of Jonah",
        "word_es": "Gran Ballena",
        "artist": "Hokusai (Deep Blue Sea)",
        "verse_en": "Walk in love, as Christ also hath loved us. — Ephesians 5:2",
        "verse_es": "Andad en amor, como también Cristo nos amó.",
        "canvas": "canvas_art_W.jpg",
        "lineart": "lineart_W.jpg"
    },
    {
        "letter": "X",
        "word_en": "Xylophone Praise",
        "word_es": "Xilófono de Música",
        "artist": "Johannes Vermeer (Baroque Music)",
        "verse_en": "eXalt the Lord our God, and worship at his holy hill. — Psalm 99:9",
        "verse_es": "Exaltad al Señor nuestro Dios, y adorad en su santo monte.",
        "canvas": "canvas_art_X.jpg",
        "lineart": "lineart_X.jpg"
    },
    {
        "letter": "Y",
        "word_en": "Youth & Joy",
        "word_es": "Juventud y Gozo",
        "artist": "Pierre-Auguste Renoir (Floral Meadow)",
        "verse_en": "Ye are the light of the world. A city that is set on an hill cannot be hid. — Matthew 5:14",
        "verse_es": "Vosotros sois la luz del mundo; una ciudad asentada sobre un monte no se puede esconder.",
        "canvas": "canvas_art_Y.jpg",
        "lineart": "lineart_Y.jpg"
    },
    {
        "letter": "Z",
        "word_en": "Zion Holy Mount",
        "word_es": "Monte de Sion",
        "artist": "Michelangelo (Celestial Temple)",
        "verse_en": "Zeal of the Lord of hosts will perform this. — Isaiah 9:7",
        "verse_es": "El celo del Señor de los ejércitos hará esto.",
        "canvas": "canvas_art_Z.jpg",
        "lineart": "lineart_Z.jpg"
    }
]

def generate_bilingual_sheet(item):
    """Genera la imagen compuesta PNG HD (para Telegram/Web) y el PDF individual de la ficha bilingüe."""
    l = item["letter"]
    png_out = UPLOADS_DIR / f"page_{l}_bilingual.png"
    pdf_out = UPLOADS_DIR / f"page_{l}_bilingual.pdf"

    # 1. High-Res PNG (1400 x 1800 px)
    base = Image.new("RGB", (1400, 1800), "#ffffff")
    d = ImageDraw.Draw(base)

    # Bordes elegantes
    d.rectangle([(30, 30), (1370, 1770)], outline="#0f172a", width=8)
    d.rectangle([(45, 45), (1355, 1755)], outline="#0f172a", width=2)

    # Header Izquierdo (Inglés Primario + Subtítulo Español)
    d.text((80, 75), f"{l} {l.lower()}", fill="#0f172a")
    d.text((280, 80), item["word_en"], fill="#0284c7")
    d.text((280, 128), f"Español: {item['word_es']}", fill="#64748b")
    d.line([(80, 175), (960, 175)], fill="#0f172a", width=3)

    # Incrustar Lienzo al Óleo de Inspiración (Top-Right)
    canvas_file = UPLOADS_DIR / item["canvas"]
    if canvas_file.exists():
        c_img = Image.open(canvas_file).convert("RGB").resize((320, 320), Image.Resampling.LANCZOS)
        base.paste(c_img, (1000, 70))
        d.text((1160, 405), f"🎨 {item['artist']}", fill="#475569", anchor="mm", align="center")

    # Incrustar Lámina de Colorear (Clean Bold Line-Art)
    lineart_file = UPLOADS_DIR / item["lineart"]
    if not lineart_file.exists() and l == "A":
        lineart_file = UPLOADS_DIR / "art_A.jpg"
    if lineart_file.exists():
        l_img = Image.open(lineart_file).convert("RGB").resize((820, 820), Image.Resampling.LANCZOS)
        base.paste(l_img, (290, 430))

    # Pautas de Caligrafía Punteada Bilingüe
    d.text((80, 1280), f"✏️ Trace uppercase '{l}' and lowercase '{l.lower()}' (Practica el trazo):", fill="#0f172a")
    
    # Fila Mayúsculas
    d.rectangle([(80, 1320), (1320, 1390)], outline="#cbd5e1", fill="#ffffff")
    d.text((700, 1355), f"{l}      {l}      {l}      {l}      {l}      {l}      {l}      {l}", fill="#94a3b8", anchor="mm")

    # Fila Minúsculas
    d.rectangle([(80, 1410), (1320, 1480)], outline="#cbd5e1", fill="#ffffff")
    d.text((700, 1445), f"{l.lower()}      {l.lower()}      {l.lower()}      {l.lower()}      {l.lower()}      {l.lower()}      {l.lower()}      {l.lower()}", fill="#94a3b8", anchor="mm")

    # Recuadro de Versículo Bíblico Bilingüe
    d.rounded_rectangle([(80, 1515), (1320, 1680)], radius=15, outline="#0f172a", width=3, fill="#f8fafc")
    d.text((700, 1545), f"📖 SCRIPTURE VERSE (LETTER {l}):", fill="#0f172a", anchor="mm")
    d.text((700, 1590), f'"{item["verse_en"]}"', fill="#0369a1", anchor="mm")
    d.text((700, 1635), f'Español: "{item["verse_es"]}"', fill="#475569", anchor="mm")

    base.save(png_out, quality=95)

    # 2. PDF Individual (300 DPI)
    c = canvas.Canvas(str(pdf_out), pagesize=letter)
    w, h = letter
    c.setLineWidth(3); c.setStrokeColor(colors.black); c.rect(20, 20, w - 40, h - 40)
    c.setLineWidth(1); c.rect(24, 24, w - 48, h - 48)

    c.setFont("Helvetica-Bold", 44); c.drawString(45, h - 68, f"{l} {l.lower()}")
    c.setFont("Helvetica-Bold", 20); c.drawString(140, h - 55, item["word_en"])
    c.setFont("Helvetica-Oblique", 11); c.setFillColor(colors.HexColor('#475569')); c.drawString(140, h - 73, f"Español: {item['word_es']}")
    c.setFillColor(colors.black)

    if canvas_file.exists():
        c.drawImage(str(canvas_file), w - 155, h - 145, width=115, height=115, mask='auto')
        c.setFont("Helvetica-Bold", 7)
        c.drawCentredString(w - 97, h - 155, f"🎨 {item['artist'][:28]}")

    c.setLineWidth(1.5); c.line(45, h - 88, w - 170, h - 88)

    if lineart_file.exists():
        c.drawImage(str(lineart_file), (w - 350)/2, h - 500, width=350, height=350, mask='auto')

    # Tracing
    trace_y = h - 520
    c.setFont("Helvetica-Bold", 10); c.drawString(45, trace_y, f"✏️ Trace uppercase '{l}' and lowercase '{l.lower()}':")
    
    l1 = trace_y - 28
    c.setLineWidth(1); c.line(45, l1 + 18, w - 45, l1 + 18)
    c.setDash(2, 2); c.line(45, l1 + 9, w - 45, l1 + 9); c.setDash([])
    c.line(45, l1, w - 45, l1)
    c.setFont("Helvetica", 16); c.setFillColor(colors.lightgrey)
    for i in range(8): c.drawString(60 + i * 64, l1 + 2, l)

    l2 = l1 - 32
    c.setFillColor(colors.black); c.setLineWidth(1)
    c.line(45, l2 + 18, w - 45, l2 + 18)
    c.setDash(2, 2); c.line(45, l2 + 9, w - 45, l2 + 9); c.setDash([])
    c.line(45, l2, w - 45, l2)
    c.setFont("Helvetica", 16); c.setFillColor(colors.lightgrey)
    for i in range(8): c.drawString(60 + i * 64, l2 + 2, l.lower())

    # Verse Box
    c.setFillColor(colors.black)
    v_box_y = 35
    c.rect(45, v_box_y, w - 90, 48, fill=0, stroke=1)
    c.setFont("Helvetica-Bold", 8); c.drawCentredString(w / 2, v_box_y + 34, f"📖 SCRIPTURE VERSE (LETTER {l}):")
    c.setFont("Helvetica-Bold", 7.5); c.drawCentredString(w / 2, v_box_y + 20, item["verse_en"][:95])
    c.setFont("Helvetica-Oblique", 7); c.setFillColor(colors.HexColor('#475569')); c.drawCentredString(w / 2, v_box_y + 8, f'Español: "{item["verse_es"][:95]}"')

    c.showPage(); c.save()
    return png_out, pdf_out

if __name__ == "__main__":
    print("🎨 Generando todas las 26 Fichas Bilingües...")
    for item in BILINGUAL_ALPHABET:
        png, pdf = generate_bilingual_sheet(item)
        print(f"✔ Generada Ficha Bilingüe: {item['letter']} ({png.name})")
    print("🏆 ¡TODAS LAS FICHAS BILINGÜES ESTÁN LISTAS!")
