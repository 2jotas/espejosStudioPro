# 🧠 PROJECT BRAIN & LIVING MEMORY (Memoria Viva Multi-Agente)

Este documento es la **fuente única de verdad compartida (Single Source of Truth)** entre **Grok AI (Arquitectura Estratégica)**, **Antigravity 2.0 (Laptop Local)** y **Hermes Maestro (VPS Contabo 24/7)**.

---

## 🎯 1. Visión y Filosofía Estratégica (Acordada con Grok AI)

Principio de 3 capas aisladas:
- **Taller (Dynabook Local - 32GB RAM / i7)**: Antigravity 2.0, desarrollo, pruebas locales y Vault de apuntes.
- **Fuente de Verdad (GitHub Privado)**: `2jotas/espejosStudioPro` y `2jotas/formacion-ciencia-datos`.
- **Fábrica 24/7 (VPS Contabo)**: Servicios en Docker, subdominios HTTPS y Hermes Daemon.

### Los 5 Pilares del Ecosistema:
1. 💈 **Web Barbería & Visagismo (`espejosstudio.cl`)**: Landing comercial, catálogo de cortes morfológicos y agendamiento online.
2. ✂️ **CRM & Asistente Romina (`app.espejosstudio.cl`)**: Gestión de citas, visagismo con inpainting IA, retención de clientes y Passkeys.
3. 🎓 **Vault 4 Años Ciencia de Datos (`formacion.espejosstudio.cl`)**: Visualizador interactivo de los 4 años de carrera (Estadística, Python, SQL, Machine Learning, RAG y playground de código).
4. 🎭 **Visagismo & AI Hair Studio (`performance.espejosstudio.cl`)**: Simulador interactivo de visagismo con selfie/cámara, renderizado de nuevo look con IA y ficha técnica gamificada para el barbero.
5. 🎬 **Fábrica de Contenido & Automatización (`auto.espejosstudio.cl`)**: Pipeline de videos virales Antes/Después, generación de guiones con hooks y distribución a TikTok/Reels/Shorts.

---

## 🛡️ 2. Reglas Inmutables de Infraestructura (Golden Guardrails)

1. **Puertos Web Obligatorios**:
   - `espejos-gateway` DEBE mapear SIEMPRE `80:80` y `443:443` hacia Cloudflare. Prohibido usar 8080/8443 en `docker-compose.yml`.
2. **Acceso SSH & Administración**:
   - Puerto `22/tcp` (SSH) 100% bloqueado a internet público. Acceso exclusivo por Tailscale (`100.93.160.96`).
3. **Protocolo Dry-Run (Pensar antes de actuar)**:
   - Todo cambio en configuraciones de servidor debe formular primero un Plan de Impacto y validar con `docker compose config`.
4. **Protección de Secretos**:
   - Nunca incluir tokens ni API Keys en texto plano en commits ni prompts. Usar variables de entorno en `.env`.

---

## 📝 3. Registro Histórico de Cambios (Agent Changelog)

| Fecha | Agente | Entorno | Resumen del Cambio |
|---|---|---|---|
| **2026-08-25** | Antigravity 2.0 | VPS | Configuración de Gateway Nginx, SSL Certbot y subdominios. |
| **2026-08-25** | Antigravity 2.0 | VPS | Blindaje UFW: SSH cerrado al público y enrutado por Tailscale. |
| **2026-08-26** | Antigravity 2.0 | GitHub | Creación del repositorio `2jotas/formacion-ciencia-datos`. |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Despliegue de servicio 24/7 `espejos-hermes` con bot `@hermejon`. |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Implementación de `self_tuner.py` (Auto-reparación e instalación de herramientas en caliente). |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Creación de `gemini_engine.py` con Thinking Mode y `PROJECT_BRAIN.md`. |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Fix anti-truncado de Telegram (Auto-chunking >4000 caracteres). |
| **2026-08-26** | Antigravity 2.0 | GitHub / Web | Creación de Vault Web `apps/formacion/` (React + Tailwind + KaTeX) y enrutamiento en Nginx para `formacion.espejosstudio.cl`. |
| **2026-08-27** | Antigravity 2.0 | VPS | Implementación de `vault_watcher.py` (auto-escáner continuo de carpetas) y despliegue de **Syncthing v2.1.3** 24/7 sobre Tailscale. |
| **2026-08-27** | Antigravity 2.0 | VPS / GitHub | Validación de `formacion.espejosstudio.cl`, indexación de ramos del Año 1 y respaldo completo en rama `main` de `2jotas/formacion-ciencia-datos`. |
| **2026-08-31** | Antigravity 2.0 | VPS / Web | Corrección de timezone offset en `CalendarManager` y `DashboardManager`; creación de `GEMINI.md` para auto-contexto multi-entorno. |
| **2026-08-31** | Antigravity 2.0 | Web | Corrección integral de URLs de reserva a `espejosstudio.cl/{slug}` en Landing, Registro, Ajustes y Pricing. |
| **2026-08-31** | Antigravity 2.0 | API / Web | Bot Inteligente de WhatsApp con Gemini 2.0 Flash, entrenamiento con chats reales (Few-Shot), recordatorios automáticos y sistema de 4 estados con código de colores en CRM (`confirmada` 🟢, `cancelada` 🔴, `reagendada` 🟡, `pendiente` 🟣). |
| **2026-09-01** | Antigravity 2.0 | API / Web | Implementación completa de motor **Baileys Multi-Device WhatsApp Web**, generación de QR real criptográfico en backend, persistencia de sesiones en volumen Docker y auto-reconexión 24/7. |
| **2026-09-01** | Antigravity 2.0 | API | Arquitectura conversacional completa con **Máquina de Estados (FSM)** para WhatsApp Bot: verificación de cliente existente vs nuevo, consulta de disponibilidad en tiempo real, menús numerados `1️⃣, 2️⃣, 3️⃣`, reserva atómica, tickets de confirmación, sincronización de Google Calendar y guardrails anti-spam. |
| **2026-09-01** | Antigravity 2.0 | API / Web | Perfeccionamiento UX de WhatsApp Bot: Menú de selección de servicios con precios y duraciones exactas, memoria inteligente de servicio habitual para clientes recurrentes, ticket con datos reales del profesional + link de Google Maps, filtro de contactos por palabra clave (`whatsappClientTagKeyword`) e importador de contactos. |
| **2026-09-02** | Antigravity 2.0 | API / Web | Formulario dedicado de Dirección Física & Teléfono Comercial con botón de verificación en Google Maps; Selector móvil de archivos `.vcf`, `.csv`, `.txt` para importar contactos de WhatsApp; y corrección estricta de huso horario (`America/Santiago`) en cálculo de slots y sincronización de Google Calendar. |
| **2026-09-02** | Antigravity 2.0 | API | Flujo interactivo multi-día (`AWAITING_DAY_CHOICE`): listado de días de la semana (1️⃣ Hoy, 2️⃣ Mañana, 3️⃣ Viernes...), despliegue de **todos** los horarios disponibles de apertura a cierre (10:00 a 20:00), y reconocimiento inteligente de horas directas ("15:00", "15 horas"). |
| **2026-09-02** | Antigravity 2.0 | Gateway / Nginx | Habilitación de subdominios `performance.espejosstudio.cl` (AI Visagismo Studio), `auto.espejosstudio.cl` (Content Automation Studio) y `bankai.espejosstudio.cl` (Hermes Master Dashboard) en Gateway Nginx HTTP y HTTPS. |
| **2026-09-02** | Antigravity 2.0 | Hermes / API | Despliegue de **Hermes Multi-Agent Harness** con 5 especialistas (**Atlas**, **Romina**, **Mercurio/Quant**, **Athena**, **Apolo**), herramientas de ejecución real (Docker socket, Shell, CRM live query, Market quotes con yfinance, Vault search) y **Antigravity Bridge** (`/agy`, `/code`) para programar e iterar por Telegram/WhatsApp. |

---

## 📍 4. Punto Exacto de Continuación (Fase Actual)

Estamos en el **Sprint 2: Desarrollo de Aplicaciones y Plataformas**:

1. ✅ **Objetivo Inmediato 1 (COMPLETADO)**: Plataforma web `https://formacion.espejosstudio.cl` conectada al repositorio `2jotas/formacion-ciencia-datos`, Syncthing activo y respaldo en GitHub al día.
2. **Objetivo Inmediato 2 (SIGUIENTE)**: Activar la fábrica de guiones diarios en `agente_contenido.md` para recibir 1 propuesta de Reel/Short cada mañana en Telegram con botón de aprobación.
3. **Objetivo Inmediato 3**: Diseñar la Landing de marca personal profesional conectada al CRM.
