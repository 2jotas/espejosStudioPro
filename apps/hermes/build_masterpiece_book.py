"""
Generador Maestro del Libro Completo: BIBLE ABC & ANIMALS (Versión Masterpiece Bestseller 2.0)
Incrusta lienzos al óleo en miniatura de alta resolución y dibujos Bold Line-Art para colorear.
"""

import os
from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.pdfgen import canvas

UPLOADS_DIR = Path("/app/workspace/apps/api/uploads")

PDF_TARGETS = [
    UPLOADS_DIR / "bible_abc_masterpiece_album.pdf",
    UPLOADS_DIR / "bible_abc_coloring_book.pdf",
    UPLOADS_DIR / "bible_abc_v2.pdf"
]

ALPHABET_DATA = [
    {
        "letter": "A",
        "word_en": "Ark of Noah",
        "word_es": "Arca de Noé",
        "artist": "William Turner (Óleo Marítimo)",
        "verse": "Al principio creó Dios los cielos y la tierra. — Génesis 1:1",
        "canvas": "canvas_art_A.jpg",
        "lineart": "art_A.jpg"
    },
    {
        "letter": "B",
        "word_en": "Bible of Truth",
        "word_es": "Biblia Sagrada",
        "artist": "Rembrandt (Claroscuro Dorado)",
        "verse": "Bendeciré al Señor en todo tiempo; su alabanza estará de continuo en mi boca. — Salmos 34:1",
        "canvas": "canvas_art_B.jpg",
        "lineart": "lineart_B.jpg"
    },
    {
        "letter": "C",
        "word_en": "Cross of Grace",
        "word_es": "Cruz de Gracia",
        "artist": "Claude Monet (Pradera al Atardecer)",
        "verse": "Crea en mí, oh Dios, un corazón limpio, y renueva un espíritu recto. — Salmos 51:10",
        "canvas": "canvas_art_C.jpg",
        "lineart": "lineart_C.jpg"
    },
    {
        "letter": "D",
        "word_en": "Dove of Peace",
        "word_es": "Paloma de la Paz",
        "artist": "Vincent van Gogh (Noche Estrellada)",
        "verse": "Dios es nuestro amparo y fortaleza, nuestro pronto auxilio en las tribulaciones. — Salmos 46:1",
        "canvas": "canvas_art_D.jpg",
        "lineart": "lineart_D.jpg"
    },
    {
        "letter": "E",
        "word_en": "Eagle in Sky",
        "word_es": "Águila Majestuosa",
        "artist": "Albert Bierstadt (Cumbres Alpinas)",
        "verse": "El Señor es mi pastor; nada me faltará. — Salmos 23:1",
        "canvas": "canvas_art_E.jpg",
        "lineart": "lineart_E.jpg"
    },
    {
        "letter": "F",
        "word_en": "Fish of Galilee",
        "word_es": "Peces del Mar",
        "artist": "Joaquín Sorolla (Luminismo Marino)",
        "verse": "Firme está mi corazón, oh Dios; cantaré y entonaré salmos con gozo. — Salmos 108:1",
        "canvas": "canvas_art_F.jpg",
        "lineart": "lineart_F.jpg"
    },
    {
        "letter": "G",
        "word_en": "Garden of Eden",
        "word_es": "Jardín Florido",
        "artist": "Claude Monet (Jardín de Giverny)",
        "verse": "Grande es el Señor, y digno de suprema alabanza. — Salmos 145:3",
        "canvas": "canvas_art_G.jpg",
        "lineart": "lineart_G.jpg"
    },
    {
        "letter": "H",
        "word_en": "Heart of Love",
        "word_es": "Corazón de Amor",
        "artist": "William Blake (Resplandor Místico)",
        "verse": "Hazme oír por la mañana tu misericordia, porque en ti he confiado. — Salmos 143:8",
        "canvas": "canvas_art_H.jpg",
        "lineart": "lineart_H.jpg"
    },
    {
        "letter": "I",
        "word_en": "Island in Ocean",
        "word_es": "Isla Tropical",
        "artist": "Paul Gauguin (Paraíso Turquesa)",
        "verse": "Instruye al niño en su camino, y aun cuando fuere viejo no se apartará de él. — Proverbios 22:6",
        "canvas": "canvas_art_I.jpg",
        "lineart": "lineart_I.jpg"
    },
    {
        "letter": "J",
        "word_en": "Jesus Good Shepherd",
        "word_es": "Jesús Buen Pastor",
        "artist": "Rafael (Renacimiento Clásico)",
        "verse": "Justo es el Señor en todos sus caminos, y misericordioso en todas sus obras. — Salmos 145:17",
        "canvas": "canvas_art_J.jpg",
        "lineart": "lineart_J.jpg"
    },
    {
        "letter": "K",
        "word_en": "King's Crown",
        "word_es": "Corona de Rey",
        "artist": "Diego Velázquez (Esplendor Real)",
        "verse": "King (Rey): Cantad alabanzas al Rey de gloria, hacedor de los cielos. — Salmos 47:6",
        "canvas": "canvas_art_K.jpg",
        "lineart": "lineart_K.jpg"
    },
    {
        "letter": "L",
        "word_en": "Lion of Judah",
        "word_es": "León de Judá",
        "artist": "Eugène Delacroix (Sabana al Ocaso)",
        "verse": "Lámpara es a mis pies tu palabra, y lumbrera a mi camino. — Salmos 119:105",
        "canvas": "canvas_art_L.jpg",
        "lineart": "lineart_L.jpg"
    },
    {
        "letter": "M",
        "word_en": "Mountain of Faith",
        "word_es": "Montaña de Fe",
        "artist": "Caspar David Friedrich (Amanecer Sublime)",
        "verse": "Mi socorro viene del Señor, que hizo los cielos y la tierra. — Salmos 121:2",
        "canvas": "canvas_art_M.jpg",
        "lineart": "lineart_M.jpg"
    },
    {
        "letter": "N",
        "word_en": "Nest of Birds",
        "word_es": "Nido de Aves",
        "artist": "John J. Audubon (Arte Botánico Clásico)",
        "verse": "No temas, porque yo estoy contigo; no desmayes, porque yo soy tu Dios. — Isaías 41:10",
        "canvas": "canvas_art_N.jpg",
        "lineart": "lineart_N.jpg"
    },
    {
        "letter": "O",
        "word_en": "Olive Tree",
        "word_es": "Rama de Olivo",
        "artist": "Vincent van Gogh (Olivar al Mediodía)",
        "verse": "Oh Señor, de mañana oirás mi voz; de mañana me presentaré delante de ti. — Salmos 5:3",
        "canvas": "canvas_art_O.jpg",
        "lineart": "lineart_O.jpg"
    },
    {
        "letter": "P",
        "word_en": "Prayer Hands",
        "word_es": "Manos en Oración",
        "artist": "Alberto Durero (Luz de Catedral Gótica)",
        "verse": "Pedid, y se os dará; buscad, y hallaréis; llamad, y se os abrirá. — Mateo 7:7",
        "canvas": "canvas_art_P.jpg",
        "lineart": "lineart_P.jpg"
    },
    {
        "letter": "Q",
        "word_en": "Queen Esther",
        "word_es": "Reina Valiente",
        "artist": "John William Waterhouse (Prerrafaelita)",
        "verse": "Quién como tú, oh Señor, entre los dioses; magnífico en santidad. — Éxodo 15:11",
        "canvas": "canvas_art_Q.jpg",
        "lineart": "lineart_Q.jpg"
    },
    {
        "letter": "R",
        "word_en": "Rainbow of Promise",
        "word_es": "Arcoíris de Promesa",
        "artist": "John Constable (Paisaje Campestre)",
        "verse": "Regocijaos en el Señor siempre. Otra vez digo: ¡Regocijaos! — Filipenses 4:4",
        "canvas": "canvas_art_R.jpg",
        "lineart": "lineart_R.jpg"
    },
    {
        "letter": "S",
        "word_en": "Star of Bethlehem",
        "word_es": "Estrella Brillante",
        "artist": "Giotto (Noche Mística de Belén)",
        "verse": "Señor, tú has sido nuestro refugio de generación en generación. — Salmos 90:1",
        "canvas": "canvas_art_S.jpg",
        "lineart": "lineart_S.jpg"
    },
    {
        "letter": "T",
        "word_en": "Tree of Life",
        "word_es": "Árbol de Vida",
        "artist": "Gustav Klimt (Árbol de Oro)",
        "verse": "Todo lo puedo en Cristo que me fortalece. — Filipenses 4:13",
        "canvas": "canvas_art_T.jpg",
        "lineart": "lineart_T.jpg"
    },
    {
        "letter": "U",
        "word_en": "Universe & Stars",
        "word_es": "Universo y Planetas",
        "artist": "Grabado Astronómico del Siglo XIX",
        "verse": "Uno solo es Dios, el Padre de quien proceden todas las cosas. — 1 Corintios 8:6",
        "canvas": "canvas_art_U.jpg",
        "lineart": "lineart_U.jpg"
    },
    {
        "letter": "V",
        "word_en": "Vine & Grapes",
        "word_es": "Vid y Uvas",
        "artist": "Caravaggio (Bodegón Clásico)",
        "verse": "Venid, adoremos y postrémonos delante del Señor nuestro Hacedor. — Salmos 95:6",
        "canvas": "canvas_art_V.jpg",
        "lineart": "lineart_V.jpg"
    },
    {
        "letter": "W",
        "word_en": "Whale of Jonah",
        "word_es": "Gran Ballena",
        "artist": "Hokusai (Gran Ola Clásica)",
        "verse": "Word (Palabra): Vivificante es la palabra de Dios en todo tiempo. — Salmos 119:50",
        "canvas": "canvas_art_W.jpg",
        "lineart": "lineart_W.jpg"
    },
    {
        "letter": "X",
        "word_en": "Xylophone Praise",
        "word_es": "Xilófono de Alabanza",
        "artist": "Johannes Vermeer (Música Barroca)",
        "verse": "X (eXaltad): Exaltad al Señor nuestro Dios, y adorad ante su estrado. — Salmos 99:5",
        "canvas": "canvas_art_X.jpg",
        "lineart": "lineart_X.jpg"
    },
    {
        "letter": "Y",
        "word_en": "Youth & Joy",
        "word_es": "Juventud y Gozo",
        "artist": "Pierre-Auguste Renoir (Pradera en Flor)",
        "verse": "Yo soy el camino, la verdad y la vida; nadie viene al Padre, sino por mí. — Juan 14:6",
        "canvas": "canvas_art_Y.jpg",
        "lineart": "lineart_Y.jpg"
    },
    {
        "letter": "Z",
        "word_en": "Zion Holy Mount",
        "word_es": "Monte de Sion",
        "artist": "Michelangelo (Templo Celestial)",
        "verse": "Z (Sion): Cantad alabanzas al Señor que habita en Sion con gozo. — Salmos 9:11",
        "canvas": "canvas_art_Z.jpg",
        "lineart": "lineart_Z.jpg"
    }
]

def build_pdf(target_path):
    c = canvas.Canvas(str(target_path), pagesize=letter)
    w, h = letter # 612 x 792 pt

    # PÁGINA 1: PORTADA
    c.setLineWidth(4); c.setStrokeColor(colors.black); c.rect(20, 20, w - 40, h - 40)
    c.setLineWidth(1.5); c.rect(25, 25, w - 50, h - 50)

    c.setFont("Helvetica-Bold", 32)
    c.drawCentredString(w / 2, h - 90, "BIBLE ABC MASTERPIECE")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(w / 2, h - 116, "26 Fine-Art Oil Masterpiece Canvases & Coloring Worksheets")
    c.setFont("Helvetica-Oblique", 11)
    c.drawCentredString(w / 2, h - 136, "Aprende el Alfabeto, Traza Letras y Colorea con Lienzos de Época")

    # Gran Lienzo de Portada
    cover_canvas = UPLOADS_DIR / "canvas_art_J.jpg"
    if not cover_canvas.exists():
        cover_canvas = UPLOADS_DIR / "canvas_art_A.jpg"
    if cover_canvas.exists():
        c.drawImage(str(cover_canvas), w/2 - 130, h - 430, width=260, height=260, mask='auto')

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

    # PÁGINAS 2 A 27: LAS 26 LETRAS
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

        c_file = UPLOADS_DIR / item["canvas"]
        if not c_file.exists():
            c_file = UPLOADS_DIR / "canvas_art_J.jpg"
        if c_file.exists():
            c.drawImage(str(c_file), canvas_x, canvas_y, width=canvas_size, height=canvas_size, mask='auto')

        c.setFont("Helvetica-Bold", 7.5)
        c.drawCentredString(canvas_x + canvas_size/2, canvas_y - 10, f"🎨 Lienzo: {item['artist']}")

        c.setLineWidth(1.5)
        c.line(45, h - 88, canvas_x - 15, h - 88)

        # Lámina Principal para Colorear (Clean Bold Line-Art)
        art_size = 350
        art_x = (w - art_size) / 2
        art_y = h - 500

        l_file = UPLOADS_DIR / item["lineart"]
        if not l_file.exists():
            l_file = UPLOADS_DIR / "lineart_J.jpg"
        if l_file.exists():
            c.drawImage(str(l_file), art_x, art_y, width=art_size, height=art_size, mask='auto')

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

    # PÁGINA 28: CERTIFICADO DE LOGRO
    c.setLineWidth(4); c.rect(20, 20, w - 40, h - 40)
    c.setLineWidth(1.5); c.rect(25, 25, w - 50, h - 50)

    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(w / 2, h - 110, "CERTIFICADO DE LOGRO")
    c.setFont("Helvetica-Bold", 15)
    c.drawCentredString(w / 2, h - 138, "¡SUPER ESTRELLA DEL ARTE Y DEL ALFABETO!")

    crown_art = UPLOADS_DIR / "lineart_L.jpg"
    if crown_art.exists():
        c.drawImage(str(crown_art), w/2 - 100, h - 350, width=200, height=200, mask='auto')

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
    for p in PDF_TARGETS:
        build_pdf(p)
    print("🏆 ¡ÁLBUM COMPILADO CON ÉXITO!")
