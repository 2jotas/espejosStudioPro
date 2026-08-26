# 🧠 PROJECT BRAIN & LIVING MEMORY (Memoria Viva Multi-Agente)

Este documento es la **fuente única de verdad compartida (Single Source of Truth)** entre **Grok AI (Arquitectura Estratégica)**, **Antigravity 2.0 (Laptop Local)** y **Hermes Maestro (VPS Contabo 24/7)**.

---

## 🎯 1. Visión y Filosofía Estratégica (Acordada con Grok AI)

Principio de 3 capas aisladas:
- **Taller (Dynabook Local - 32GB RAM / i7)**: Antigravity 2.0, desarrollo, pruebas locales y Vault de apuntes.
- **Fuente de Verdad (GitHub Privado)**: `2jotas/espejosStudioPro` y `2jotas/formacion-ciencia-datos`.
- **Fábrica 24/7 (VPS Contabo)**: Servicios en Docker, subdominios HTTPS y Hermes Daemon.

### Los 4 Pilares del Ecosistema:
1. 💈 **Web Barbería & Visagismo (`espejosstudio.cl`)**: Landing comercial, catálogo de cortes morfológicos y agendamiento online.
2. ✂️ **CRM & Asistente Giovanni (`app.espejosstudio.cl`)**: Gestión de citas, visagismo con inpainting IA, retención de clientes y Passkeys.
3. 🎓 **Vault 4 Años Ciencia de Datos (`formacion.espejosstudio.cl`)**: Visualizador interactivo de los 4 años de carrera (Estadística, Python, SQL, Machine Learning, RAG y playground de código).
4. 🎬 **Fábrica de Contenido & Monetización (1 Reel/Short diario)**: Automatización de hooks, guiones virales y copywriting gestionado por `agente_contenido`.

---

## 🏛️ 2. Estado de Infraestructura & Ciberseguridad

- **VPS IP**: `161.97.76.187`
- **Tailscale IP Privada**: `100.93.160.96` (VPS) / `100.93.43.122` (Laptop Dynabook).
- **Firewall UFW**:
  - `80/tcp` y `443/tcp`: Abiertos con Rate Limiting y Cloudflare SSL.
  - `22/tcp` (SSH): **100% Bloqueado al internet público**. Exclusivo por Tailscale VPN (`tailscale0`).
- **Hermes Daemon (`espejos-hermes`)**:
  - Auto-Tuning en caliente activo (`self_tuner.py`).
  - Cerebro Multi-Modelo: Gemini 2.0 Flash / Pro con Thinking + Fallback a GPT-OSS-120B / Groq Compound.
  - Memoria Compartida viva en `/app/PROJECT_BRAIN.md`.

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

---

## 📍 4. Punto Exacto de Continuación (Fase Actual)

Estamos en el **Sprint 2: Desarrollo de Aplicaciones y Plataformas**:

1. **Objetivo Inmediato 1**: Conectar la plataforma web de `https://formacion.espejosstudio.cl` al repositorio `2jotas/formacion-ciencia-datos` y desplegar el visor jerárquico de 4 años de carrera.
2. **Objetivo Inmediato 2**: Activar la fábrica de guiones diarios en `agente_contenido.md` para recibir 1 propuesta de Reel/Short cada mañana en Telegram con botón de aprobación.
3. **Objetivo Inmediato 3**: Diseñar la Landing de marca personal profesional conectada al CRM.
