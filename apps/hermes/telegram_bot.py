import os
import json
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

import orchestrator as orch
import tools

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def send_safe_reply(update: Update, text: str):
    CHUNK_SIZE = 4000
    if not text:
        return
    msg = update.effective_message or update.message
    if not msg:
        return
    for i in range(0, len(text), CHUNK_SIZE):
        chunk = text[i:i + CHUNK_SIZE]
        try:
            await msg.reply_text(chunk, parse_mode="Markdown")
        except Exception as err:
            try:
                await msg.reply_text(chunk)
            except Exception as e2:
                print(f"[TelegramBot] Error sending reply: {e2}", flush=True)


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
        resultado = orch.run_specific_agent(agent_key, prompt_text)
        await send_safe_reply(update, resultado)
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {e}")


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
    res = tools.docker_ps()
    await send_safe_reply(update, res)

async def cmd_logs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    target = context.args[0] if context.args else "espejos-api"
    res = tools.docker_logs(target, tail=30)
    await send_safe_reply(update, res)

async def cmd_restart(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not context.args:
        await send_safe_reply(update, "⚠️ Especifica el contenedor a reiniciar. Ej: `/restart espejos-api`")
        return
    res = tools.docker_restart(context.args[0])
    await send_safe_reply(update, res)

async def cmd_crm(update: Update, context: ContextTypes.DEFAULT_TYPE):
    res = tools.query_crm_summary()
    await send_safe_reply(update, res)

async def cmd_quote(update: Update, context: ContextTypes.DEFAULT_TYPE):
    sym = context.args[0] if context.args else "BTC-USD"
    res = tools.get_market_quote(sym)
    await send_safe_reply(update, res)

async def cmd_sh(update: Update, context: ContextTypes.DEFAULT_TYPE):
    cmd_str = " ".join(context.args) if context.args else ""
    if not cmd_str:
        await send_safe_reply(update, "⚠️ Especifica el comando a ejecutar. Ej: `/sh git status`")
        return
    await send_safe_reply(update, f"⚡ *Ejecutando:* `{cmd_str}`...")
    res = tools.execute_shell(cmd_str)
    await send_safe_reply(update, f"```\n{res}\n```")


async def cmd_antigravity(update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    print(f"[TelegramBot] /agy command received: {prompt_text}", flush=True)
    if not prompt_text:
        await send_safe_reply(update, "⚠️ Escribe tu instrucción de programación para Antigravity.\nEj: `/agy revisa el estado del repositorio y lista tareas pendientes`")
        return

    await send_safe_reply(update, "🚀 *Invocando a Antigravity Engine en el VPS...*\n_Analizando el proyecto y ejecutando tareas de ingeniería..._")
    try:
        resultado = tools.run_antigravity_bridge(prompt_text, continue_session=True)
        await send_safe_reply(update, f"🧠 *Respuesta de Antigravity (Bridge):*\n\n{resultado}")
    except Exception as e:
        print(f"[TelegramBot] cmd_antigravity error: {e}", flush=True)
        msg = update.effective_message or update.message
        if msg:
            await msg.reply_text(f"❌ Error en Antigravity Bridge: {e}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.effective_message or update.message
    text = (msg.text or "").strip() if msg else ""
    print(f"[TelegramBot] Natural message received: '{text}'", flush=True)
    if not text:
        return

    await send_safe_reply(update, "⚡ *Orquestando solicitud con Hermes...*")

    try:
        data = orch.orchestrate(text)
        resultado = data.get("resultado", "")
        await send_safe_reply(update, resultado)
    except Exception as e:
        print(f"[TelegramBot] handle_message error: {e}", flush=True)
        if msg:
            await msg.reply_text(f"❌ Error procesando la solicitud: {e}")


def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    
    # Comandos de Sistema & Ayuda
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("agentes", list_agents))
    app.add_handler(CommandHandler("ayuda", ayuda))

    # Antigravity Bridge
    app.add_handler(CommandHandler("agy", cmd_antigravity))
    app.add_handler(CommandHandler("antigravity", cmd_antigravity))
    app.add_handler(CommandHandler("code", cmd_antigravity))

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
    app.add_handler(CommandHandler("quote", cmd_quote))
    app.add_handler(CommandHandler("sh", cmd_sh))

    # Mensajes Naturales
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("🚀 Hermes Multi-Agent Harness corriendo en VPS 24/7...", flush=True)
    app.run_polling()


if __name__ == "__main__":
    main()
