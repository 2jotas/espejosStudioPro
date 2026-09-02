import os
import json
import asyncio
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, CallbackQueryHandler, filters, ContextTypes

import orchestrator as orch
import tools

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def send_safe_reply(update: Update, text: str):
    if not text:
        return
    msg = update.effective_message or update.message
    if not msg:
        return

    # Dividir texto respetando párrafos para nunca romper bloques Markdown
    MAX_LEN = 3500
    chunks = []
    current_chunk = ""

    for paragraph in text.split("\n\n"):
        if len(current_chunk) + len(paragraph) + 2 <= MAX_LEN:
            current_chunk += (paragraph + "\n\n")
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            # Si el párrafo por sí solo supera MAX_LEN, cortarlo
            if len(paragraph) > MAX_LEN:
                for i in range(0, len(paragraph), MAX_LEN):
                    chunks.append(paragraph[i:i + MAX_LEN])
                current_chunk = ""
            else:
                current_chunk = paragraph + "\n\n"

    if current_chunk.strip():
        chunks.append(current_chunk.strip())

    if not chunks:
        chunks = [text]

    print(f"[TelegramBot] send_safe_reply: delivering {len(chunks)} message segment(s)...", flush=True)

    for idx, chunk in enumerate(chunks):
        if not chunk:
            continue
        try:
            await msg.reply_text(chunk, parse_mode="Markdown")
            print(f"[TelegramBot] Segment {idx + 1}/{len(chunks)} sent (Markdown mode)", flush=True)
        except Exception as err:
            print(f"[TelegramBot] Segment {idx + 1}/{len(chunks)} Markdown failed ({err}), retrying plain text...", flush=True)
            try:
                # Limpiar caracteres conflictivos en plain text
                clean_chunk = chunk.replace("```", "").replace("**", "")
                await msg.reply_text(clean_chunk)
                print(f"[TelegramBot] Segment {idx + 1}/{len(chunks)} sent (Plain text mode)", flush=True)
            except Exception as e2:
                print(f"[TelegramBot] Fatal error sending segment {idx + 1}: {e2}", flush=True)
        await asyncio.sleep(0.3)



async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = (
        "🤖 *¡Hola! Soy Hermes, tu Ecosistema Multi-Agente 24/7.*\n\n"
        "Cuento con 5 Agentes Especialistas y herramientas reales conectadas a tu VPS:\n\n"
        "🛡️ `/atlas` : DevOps, Docker, UFW, logs y salud del VPS.\n"
        "💎 `/romina` : CRM, citas, clientes y visagismo Espejos Studio.\n"
        "📈 `/quant` : Trading, criptomonedas, bolsa, RSI y análisis técnico.\n"
        "🎓 `/athena` : Carrera de Ciencia de Datos, Python, SQL y Vault RAG.\n"
        "🚀 `/apolo` : Contenido viral, funnels y monetización automática.\n\n"
        "🛠️ *Comandos de Acción Directa en el VPS:*\n"
        "👉 `/docker` : Estado en vivo de todos los contenedores.\n"
        "👉 `/logs <servicio>` : Ver últimos logs (`espejos-api`, `espejos-web`...).\n"
        "👉 `/crm` : Resumen en vivo de clientes y citas.\n"
        "👉 `/quote <ticker>` : Cotización en vivo (ej: `/quote btc`, `/quote nvda`).\n"
        "👉 `/restart <servicio>` : Reiniciar un contenedor del VPS.\n"
        "👉 `/sh <comando>` : Ejecutar comando de terminal en el repositorio.\n\n"
        "💬 O escribe cualquier mensaje natural y el agente especialista te responderá."
    )
    await send_safe_reply(update, welcome)


async def list_agents(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "👥 *Los 5 Agentes Especialistas de Hermes:*\n\n"
        "1️⃣ 🛡️ *Atlas — DevOps & SysAdmin* (`/atlas`)\n"
        "   • Guardián del VPS, Docker, UFW, Git y despliegues.\n\n"
        "2️⃣ 💎 *Romina — Directora de Operaciones & Visagismo* (`/romina`)\n"
        "   • Gestión de CRM, clientes, citas y estética con IA.\n\n"
        "3️⃣ 📈 *Mercurio / Quant — Trading & Finanzas* (`/quant`)\n"
        "   • Análisis técnico, criptoactivos, bolsa y optimización de bots.\n\n"
        "4️⃣ 🎓 *Athena — Tutora Ciencia de Datos & RAG* (`/athena`)\n"
        "   • Malla de 4 años de carrera, Python, SQL y Vault de Obsidian.\n\n"
        "5️⃣ 🚀 *Apolo — Growth & Monetización* (`/apolo`)\n"
        "   • Guiones virales, productos digitales y automatización `auto.espejosstudio.cl`."
    )
    await send_safe_reply(update, text)


async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "💡 *Ejemplos de Uso de Hermes:* \n\n"
        "• *DevOps*: `¿Cómo están los contenedores de Docker?` o `/docker`\n"
        "• *CRM*: `¿Cuántas citas confirmadas hay para hoy?` o `/crm`\n"
        "• *Trading*: `¿Cómo está el RSI de Bitcoin y Ethereum?` o `/quote btc`\n"
        "• *Universidad*: `Explícame qué es una regresión logística en Python`\n"
        "• *Contenido*: `Crea un guión viral de 30s sobre visagismo masculino`"
    )
    await send_safe_reply(update, text)


async def run_forced_agent(agent_key: str, update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    if not prompt_text:
        await send_safe_reply(update, f"⚠️ Escribe tu consulta después del comando. Ej: `/{agent_key} tu pregunta`")
        return

    await send_safe_reply(update, f"⚡ *Ejecutando agente `{agent_key.upper()}`...*")
    try:
        resultado = await asyncio.to_thread(orch.run_specific_agent, agent_key, prompt_text)
        await send_safe_reply(update, resultado)
    except Exception as e:
        msg = update.effective_message or update.message
        if msg:
            await msg.reply_text(f"❌ Error: {e}")


# Handlers por Agente
async def cmd_atlas(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await run_forced_agent("devops", update, context)

async def cmd_romina(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await run_forced_agent("espejos", update, context)

async def cmd_quant(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await run_forced_agent("trading", update, context)

async def cmd_athena(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await run_forced_agent("universidad", update, context)

async def cmd_apolo(update: Update, context: ContextTypes.DEFAULT_TYPE):
    await run_forced_agent("contenido", update, context)


# Handlers de Herramientas Directas
async def cmd_docker(update: Update, context: ContextTypes.DEFAULT_TYPE):
    res = await asyncio.to_thread(tools.docker_ps)
    await send_safe_reply(update, res)

async def cmd_logs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    target = context.args[0] if context.args else "espejos-api"
    res = await asyncio.to_thread(tools.docker_logs, target, 30)
    await send_safe_reply(update, res)

async def cmd_restart(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await send_safe_reply(update, "⚠️ Especifica el contenedor a reiniciar. Ej: `/restart espejos-api`")
        return
    res = await asyncio.to_thread(tools.docker_restart, context.args[0])
    await send_safe_reply(update, res)

async def cmd_crm(update: Update, context: ContextTypes.DEFAULT_TYPE):
    res = await asyncio.to_thread(tools.query_crm_summary)
    await send_safe_reply(update, res)

async def cmd_quote(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sym = context.args[0] if context.args else "BTC-USD"
    res = await asyncio.to_thread(tools.get_market_quote, sym)
    await send_safe_reply(update, res)

async def cmd_sh(update: Update, context: ContextTypes.DEFAULT_TYPE):
    cmd_str = " ".join(context.args) if context.args else ""
    if not cmd_str:
        await send_safe_reply(update, "⚠️ Especifica el comando a ejecutar. Ej: `/sh git status`")
        return
    await send_safe_reply(update, f"⚡ *Ejecutando:* `{cmd_str}`...")
    res = await asyncio.to_thread(tools.execute_shell, cmd_str)
    await send_safe_reply(update, f"```\n{res}\n```")


async def cmd_antigravity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    print(f"[TelegramBot] /agy command received: {prompt_text}", flush=True)
    if not prompt_text:
        await send_safe_reply(update, "⚠️ Escribe tu instrucción de programación para Antigravity.\nEj: `/agy revisa el estado del repositorio y lista tareas pendientes`")
        return

    await send_safe_reply(update, "🚀 *Invocando a Antigravity Engine en el VPS...*\n_Analizando el proyecto y ejecutando tareas de ingeniería..._")
    try:
        resultado = await asyncio.to_thread(tools.run_antigravity_bridge, prompt_text, True)
        await send_safe_reply(update, f"🧠 *Respuesta de Antigravity (Bridge):*\n\n{resultado}")
    except Exception as e:
        print(f"[TelegramBot] cmd_antigravity error: {e}", flush=True)
        msg = update.effective_message or update.message
        if msg:
            await msg.reply_text(f"❌ Error en Antigravity Bridge: {e}")


async def cmd_eval(update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    if not prompt_text:
        await send_safe_reply(update, "⚠️ Especifica la consulta a evaluar y optimizar con Antigravity.\nEj: `/eval ¿Cuál es la mejor arquitectura para escalar el CRM?`")
        return

    await send_safe_reply(update, "🧠 *Iniciando Doble Pasada (Agente Especialista + Evaluación y Optimización con Antigravity)...*")
    try:
        data = await asyncio.to_thread(orch.orchestrate_with_eval, prompt_text)
        resultado_opt = data.get("resultado_optimizado", "")
        await send_safe_reply(update, resultado_opt)
    except Exception as e:
        print(f"[TelegramBot] cmd_eval error: {e}", flush=True)
        msg = update.effective_message or update.message
        if msg:
            await msg.reply_text(f"❌ Error en evaluación Antigravity: {e}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.effective_message or update.message
    text = (msg.text or "").strip() if msg else ""
    print(f"[TelegramBot] Natural message received: '{text}'", flush=True)
    if not text:
        return

    if update.effective_chat:
        try:
            await context.bot.send_chat_action(chat_id=update.effective_chat.id, action="typing")
        except Exception:
            pass

    try:
        data = await asyncio.to_thread(orch.orchestrate, text)
        resultado = data.get("resultado", "")
        print(f"[TelegramBot] Orchestration complete, delivering {len(resultado)} chars...", flush=True)
        await send_safe_reply(update, resultado)
    except Exception as e:
        print(f"[TelegramBot] handle_message error: {e}", flush=True)
        if msg:
            await msg.reply_text(f"❌ Error procesando la solicitud: {e}")


import domain_expansion as de


async def cmd_dominio(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = de.get_active_domains()
    await send_safe_reply(update, msg)


async def cmd_video(update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    if not prompt_text:
        await send_safe_reply(update, "⚠️ Especifica el prompt para la Extensión de Dominio de Vídeo.\nEj: `/video Time-lapse coloreando mandala de león geométrico en papel 4K vertical`")
        return

    await send_safe_reply(update, "🌌 *Activando Extensión de Dominio: Cinema Cuántico (Ultra-Fast Video)...*\n_Procesando pipeline de vídeo con IA..._")
    try:
        res = await asyncio.to_thread(de.generate_fast_video, prompt_text)
        if res.get("video_url"):
            video_url = res["video_url"]
            await send_safe_reply(update, f"🎬 *Vídeo Ultra-Rápido Generado con Éxito ({res.get('provider')}):*\n\n🔗 [Ver / Descargar Vídeo MP4]({video_url})")
            if update.effective_chat:
                try:
                    await context.bot.send_video(chat_id=update.effective_chat.id, video=video_url, caption=f"✨ {prompt_text[:100]}")
                except Exception:
                    pass
        else:
            await send_safe_reply(update, res.get("prompt_optimizado", "Vídeo procesado."))
    except Exception as e:
        print(f"[TelegramBot] cmd_video error: {e}", flush=True)
        msg = update.effective_message or update.message
        if msg:
            await msg.reply_text(f"❌ Error en Extensión de Dominio Video: {e}")


from build_bilingual_pages import BILINGUAL_ALPHABET

async def send_bilingual_letter(chat_id: int, letter_char: str, context: ContextTypes.DEFAULT_TYPE):
    """Envía la ficha bilingüe de una letra específica para revisión interactiva."""
    letter_char = letter_char.upper()
    item = next((x for x in BILINGUAL_ALPHABET if x["letter"] == letter_char), None)
    if not item:
        await context.bot.send_message(chat_id=chat_id, text=f"⚠️ Letra `{letter_char}` no encontrada en el catálogo.")
        return

    caption = (
        f"🎨 *REVISIÓN BILINGÜE: LETRA {letter_char}*\n\n"
        f"• **Título en Inglés (Primario):** `{item['word_en']}`\n"
        f"• **Subtítulo en Español:** `{item['word_es']}`\n"
        f"• **Lienzo al Óleo de Inspiración:** {item['artist']}\n"
        f"• **Lámina de Coloreado:** `Clean Bold Line-Art` (Líneas gruesas de 300 DPI)\n"
        f"• **Pauta de Caligrafía:** Trazo guiado de `{letter_char}` y `{letter_char.lower()}`\n\n"
        f"📖 **Scripture Verse ({letter_char}):**\n"
        f"_{item['verse_en']}_\n"
        f"_Español: \"{item['verse_es']}\"_\n\n"
        f"🔗 [Descargar Ficha PDF](https://espejosstudio.cl/uploads/page_{letter_char}_bilingual.pdf)\n"
        f"🔗 [Ver Imagen en HD](https://espejosstudio.cl/uploads/page_{letter_char}_bilingual.png)"
    )

    keyboard = [
        [
            InlineKeyboardButton(f"✅ APROBAR LETRA {letter_char}", callback_data=f"approve_{letter_char}"),
            InlineKeyboardButton("✏️ AJUSTE", callback_data=f"reject_{letter_char}")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    photo_path = f"/app/workspace/apps/api/uploads/page_{letter_char}_bilingual.png"
    if os.path.exists(photo_path):
        with open(photo_path, "rb") as f:
            await context.bot.send_photo(chat_id=chat_id, photo=f, caption=caption, parse_mode="Markdown", reply_markup=reply_markup)
    else:
        await context.bot.send_message(chat_id=chat_id, text=caption, parse_mode="Markdown", reply_markup=reply_markup)


async def cmd_revisar(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Comando para iniciar la revisión secuencial del abecedario (/revisar o /revisar b)."""
    chat = update.effective_chat
    if not chat:
        return

    target_letter = "A"
    if context.args and len(context.args) > 0:
        target_letter = context.args[0][0].upper()

    await send_bilingual_letter(chat.id, target_letter, context)


async def handle_callback_query(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Manejador dinámico de aprobación: avanza automáticamente a la siguiente letra."""
    query = update.callback_query
    if not query:
        return
    await query.answer()

    data = query.data or ""
    chat_id = update.effective_chat.id if update.effective_chat else None

    if data.startswith("approve_"):
        letter_char = data.split("_")[1].upper()
        
        # Editar pie de foto confirmando aprobación
        await query.edit_message_caption(
            caption=(
                f"✅ *¡LETRA {letter_char} APROBADA Y CERTIFICADA!* 🎉\n"
                f"La ficha `{letter_char}` queda guardada en el máster final.\n"
                "Cargando la siguiente letra..."
            ),
            parse_mode="Markdown"
        )

        # Calcular siguiente letra
        next_char = chr(ord(letter_char) + 1)
        if next_char <= "Z" and chat_id:
            await send_bilingual_letter(chat_id, next_char, context)
        elif next_char > "Z" and chat_id:
            # Fin del abecedario: Álbum completo aprobado
            await context.bot.send_message(
                chat_id=chat_id,
                text=(
                    "🏆 *¡FELICITACIONES! HAS APROBADO LAS 26 LETRAS (A - Z)* 🌟🎉\n\n"
                    "El Álbum Completo **Bible ABC Masterpiece Edition** ha sido compilado a 300 DPI y está listo para lanzamiento comercial.\n\n"
                    "📥 **Descargar Álbum Maestro (28 Páginas):**\n"
                    "https://espejosstudio.cl/uploads/bible_abc_masterpiece_album.pdf\n\n"
                    "✨ **Galería Web Oficial:**\n"
                    "https://espejosstudio.cl/uploads/album_preview.html\n\n"
                    "🚀 ¡Listo para publicar en Gumroad y Etsy!"
                ),
                parse_mode="Markdown"
            )

    elif data.startswith("reject_"):
        letter_char = data.split("_")[1].upper()
        await query.edit_message_caption(
            caption=(
                f"✏️ *Solicitud de ajuste para la Letra {letter_char}.*\n"
                "Escríbeme por aquí qué elemento específico deseas afinar (óleo, frase o dibujo)."
            ),
            parse_mode="Markdown"
        )




def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    
    # Comandos de Sistema & Ayuda
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("agentes", list_agents))
    app.add_handler(CommandHandler("ayuda", ayuda))

    # Extensión de Dominio (Domain Expansion)
    app.add_handler(CommandHandler("dominio", cmd_dominio))
    app.add_handler(CommandHandler("expansion", cmd_dominio))
    app.add_handler(CommandHandler("video", cmd_video))
    app.add_handler(CommandHandler("animar", cmd_video))

    # Antigravity Bridge & Dual-Pass Evaluator
    app.add_handler(CommandHandler("agy", cmd_antigravity))
    app.add_handler(CommandHandler("antigravity", cmd_antigravity))
    app.add_handler(CommandHandler("code", cmd_antigravity))
    app.add_handler(CommandHandler("eval", cmd_eval))
    app.add_handler(CommandHandler("super", cmd_eval))
    app.add_handler(CommandHandler("judge", cmd_eval))

    # Comandos de Agentes
    app.add_handler(CommandHandler("atlas", cmd_atlas))
    app.add_handler(CommandHandler("devops", cmd_atlas))
    app.add_handler(CommandHandler("romina", cmd_romina))
    app.add_handler(CommandHandler("espejos", cmd_romina))
    app.add_handler(CommandHandler("quant", cmd_quant))
    app.add_handler(CommandHandler("trading", cmd_quant))
    app.add_handler(CommandHandler("mercurio", cmd_quant))
    app.add_handler(CommandHandler("athena", cmd_athena))
    app.add_handler(CommandHandler("universidad", cmd_athena))
    app.add_handler(CommandHandler("apolo", cmd_apolo))
    app.add_handler(CommandHandler("contenido", cmd_apolo))

    # Herramientas Directas
    app.add_handler(CommandHandler("docker", cmd_docker))
    app.add_handler(CommandHandler("logs", cmd_logs))
    app.add_handler(CommandHandler("restart", cmd_restart))
    app.add_handler(CommandHandler("crm", cmd_crm))
    # Flujo de Aprobación Secuencial Bilingüe (A-Z)
    app.add_handler(CommandHandler("revisar", cmd_revisar))
    app.add_handler(CommandHandler("boceto", cmd_revisar))
    app.add_handler(CommandHandler("ficha", cmd_revisar))
    app.add_handler(CommandHandler("abc", cmd_revisar))
    app.add_handler(CallbackQueryHandler(handle_callback_query))

    # Mensajes Naturales
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🚀 Hermes Multi-Agent Harness corriendo en VPS 24/7...", flush=True)
    app.run_polling()


if __name__ == "__main__":
    main()
