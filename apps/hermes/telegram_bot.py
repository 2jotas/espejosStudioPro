import os
import json
from telegram import Update
from telegram.ext import ApplicationBuilder, CommandHandler, MessageHandler, filters, ContextTypes

import orchestrator as orch

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")


async def start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    welcome = (
        "🤖 *¡Hola! Soy Hermes, tu Bot Maestro Orquestador 24/7.*\n\n"
        "Derivo tus solicitudes al agente adecuado en tiempo real:\n"
        "- 🎓 `/universidad` : Ejercicios SQL/Python, algoritmos y Vault de Ciencia de Datos.\n"
        "- ✂️ `/espejos` : CRM, agendamiento, visagismo morfológico y clientes.\n"
        "- 🎬 `/contenido` : Reels, Shorts, copy, hooks y monetización de redes (1 diario).\n"
        "- 🛡️ `/devops` : Estado del VPS (`100.93.160.96`), contenedores Docker, Pull Requests y despliegues por Tailscale.\n\n"
        "Comandos disponibles:\n"
        "👉 `/agentes` - Ver la lista detallada de agentes activos.\n"
        "👉 `/ayuda` - Ver instrucciones y ejemplos de uso.\n\n"
        "Escribe cualquier mensaje directamente y seleccionaré el agente ideal para responderte."
    )
    await update.message.reply_text(welcome, parse_mode="Markdown")


async def list_agents(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "👥 *Lista de Agentes Especializados Activos en Hermes:*\n\n"
        "1️⃣ 🎓 *Agente Universidad* (`agente_universidad.md`)\n"
        "   • *Especialización*: Ciencia de Datos, Python, SQL, Estadística y Vault Universitario.\n"
        "   • *Comando*: `/universidad <tu pregunta>`\n\n"
        "2️⃣ ✂️ *Agente Espejos* (`agente_espejos.md`)\n"
        "   • *Especialización*: CRM Barbería, Visagismo Morfológico, Citas y Clientes.\n"
        "   • *Comando*: `/espejos <tu consulta>`\n\n"
        "3️⃣ 🎬 *Agente Contenido* (`agente_contenido.md`)\n"
        "   • *Especialización*: Guiones de Reels, Shorts, Copywriting y Publicación (1 post/día).\n"
        "   • *Comando*: `/contenido <tu tema>`\n\n"
        "4️⃣ 🛡️ *Agente Senior DevOps* (`agente_devops.md`)\n"
        "   • *Especialización*: Auditoría GitHub, Estado del VPS (`100.93.160.96`), UFW y Despliegues.\n"
        "   • *Comando*: `/devops <tu orden>`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def ayuda(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "💡 *Guía de Uso de Hermes:* \n\n"
        "• Puedes escribir cualquier mensaje natural (ej: *'Crea una idea de Reel para barbería'*) y Hermes elegirá automáticamente el agente adecuado.\n"
        "• O puedes forzar un agente específico usando su comando:\n"
        "  - `/universidad Explícame qué es una regresión lineal en Python`\n"
        "  - `/espejos ¿Cómo funciona el módulo de visagismo?`\n"
        "  - `/contenido Dame el guión del Reel de hoy`\n"
        "  - `/devops Revisa el estado de la infraestructura`"
    )
    await update.message.reply_text(text, parse_mode="Markdown")


async def run_forced_agent(agent_key: str, update: Update, context: ContextTypes.DEFAULT_TYPE):
    prompt_text = " ".join(context.args) if context.args else ""
    if not prompt_text:
        await update.message.reply_text(f"⚠️ Escribe tu consulta después del comando. Ej: `/{agent_key} tu pregunta`", parse_mode="Markdown")
        return

    await update.message.reply_text(f"⚡ *Ejecutando agente `{agent_key.upper()}`...*", parse_mode="Markdown")
    try:
        resultado = orch.run_specific_agent(agent_key, prompt_text)
        respuesta = (
            f"🤖 *Respuesta del Agente `{agent_key.upper()}`:*\n\n"
            f"{resultado}"
        )
        await update.message.reply_text(respuesta, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error: {e}")


async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    if not text:
        return

    await update.message.reply_text("⚡ *Orquestando solicitud con Hermes...*", parse_mode="Markdown")

    try:
        data = orch.orchestrate(text)

        categoria = data.get("agente_asignado", "unknown")
        resultado = data.get("resultado", "")
        archivo = data.get("archivo_salida", "")

        respuesta = (
            f"🤖 *Agente Seleccionado:* `{categoria.upper()}`\n\n"
            f"*Respuesta:*\n{resultado}\n\n"
            f"📂 *Registro guardado:* `{archivo}`"
        )
        await update.message.reply_text(respuesta, parse_mode="Markdown")
    except Exception as e:
        await update.message.reply_text(f"❌ Error procesando la solicitud: {e}")


def main():
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("agentes", list_agents))
    app.add_handler(CommandHandler("ayuda", ayuda))
    app.add_handler(CommandHandler("universidad", lambda u, c: run_forced_agent("universidad", u, c)))
    app.add_handler(CommandHandler("espejos", lambda u, c: run_forced_agent("espejos", u, c)))
    app.add_handler(CommandHandler("contenido", lambda u, c: run_forced_agent("contenido", u, c)))
    app.add_handler(CommandHandler("devops", lambda u, c: run_forced_agent("devops", u, c)))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))

    print("Bot Maestro @hermejon corriendo activamente en Docker VPS 24/7...")
    app.run_polling()


if __name__ == "__main__":
    main()
