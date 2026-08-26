# 🧠 PROJECT BRAIN & LIVING MEMORY (Memoria Viva Multi-Agente)

Este archivo es la **fuente única de verdad (Single Source of Truth)** compartida en tiempo real entre **Antigravity 2.0 (Laptop Local)** y **Hermes Agent (VPS Contabo)**.

---

## 🏛️ 1. Arquitectura General del Ecosistema

- **Repositorio Principal**: `2jotas/espejosStudioPro` (Barbería CRM + Visagismo IA + Gateway Nginx).
- **Repositorio Universitario**: `2jotas/formacion-ciencia-datos` (Vault 4 Años Ciencia de Datos + Python RAG).
- **Infraestructura VPS**: Contabo (`161.97.76.187` / Tailscale `100.93.160.96`).
- **Dominio Oficial**: `espejosstudio.cl` (Gestionado en NIC Chile + Cloudflare SSL).
- **Subdominios Activos**:
  - `espejosstudio.cl` / `www.espejosstudio.cl` ➡️ Landing Page y Reserva Online Barbería.
  - `app.espejosstudio.cl` ➡️ CRM Barbero, Asistente Maestro Giovanni (Visagismo e Inpainting IA), Passkeys WebAuthn.
  - `formacion.espejosstudio.cl` ➡️ Vault interactivo de Ciencia de Datos y Python.

---

## ⚙️ 2. Stack Tecnológico & Componentes

| Componente | Tecnología | Puerto Interno | Función |
|---|---|---|---|
| **Gateway** | Nginx Alpine + SSL Certbot | `8080` (HTTP) / `8443` (HTTPS) | Enrutador de subdominios y proxy reverso. |
| **Backend API** | Fastify + TypeScript + Prisma ORM | `3000` | Endpoints REST, autenticación JWT/Passkey, base de datos. |
| **Frontend Web** | React 18 + Vite + TailwindCSS | `80` (en Nginx) | Interfaz de usuario para clientes y barberos. |
| **Hermes Agent** | Python 3.11 + Telegram + Gemini Pro/Flash | Autónomo (Daemon) | Asistente orquestador 24/7, DevOps, Contenido y Universidad. |

---

## 🛡️ 3. Reglas de Ciberseguridad & Buenas Prácticas

1. **Firewall UFW**:
   - Puertos públicos permitidos: `80/tcp` y `443/tcp` (con Rate Limiting).
   - Puerto `22/tcp` (SSH) permitido **únicamente a través de la interfaz privada de Tailscale (`tailscale0`)**.
2. **Gestión de Secretos**:
   - Nunca incluir API Keys ni contraseñas en commits de Git ni en prompts.
   - Usar siempre variables de entorno en el archivo `.env`.
3. **Flujo de Modificación Multi-Agente**:
   - Todo cambio de código debe compilar (`npm run build`) sin errores antes de hacer commit.
   - Cada agente debe registrar sus cambios en la sección 4 de este archivo.

---

## 📝 4. Registro Vivo de Cambios (Agent Changelog)

| Fecha | Agente Responsable | Entorno | Resumen del Cambio / Función Agregada |
|---|---|---|---|
| **2026-08-25** | Antigravity 2.0 | Laptop Local | Configuración inicial de subdominios `espejosstudio.cl`, `app` y `formacion` en `nginx.gateway.conf`. |
| **2026-08-25** | Antigravity 2.0 | VPS Remote | Hardening de UFW: Bloqueo de SSH público y habilitación de acceso exclusivo por Tailscale `100.93.160.96`. |
| **2026-08-26** | Antigravity 2.0 | Laptop / GitHub | Creación del repositorio oficial `2jotas/formacion-ciencia-datos`. |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Despliegue de servicio 24/7 `espejos-hermes` con bot `@hermejon` y agentes especializados. |
| **2026-08-26** | Antigravity 2.0 | VPS Docker | Integración de módulo `self_tuner.py` (Auto-Tuning y auto-instalación en caliente de herramientas). |
| **2026-08-26** | Antigravity 2.0 | Laptop / VPS | Creación de `PROJECT_BRAIN.md` para sincronización de contexto y memoria viva entre agentes. |

---

## 🎯 5. Tareas Pendientes & Roadmap

- [ ] Integrar motor Gemini 2.5 Pro con Thinking y Context Caching en `apps/hermes/gemini_engine.py`.
- [ ] Estructurar la interfaz web del Vault universitario en `formacion.espejosstudio.cl`.
- [ ] Diseñar el sitio web personal profesional del usuario.
- [ ] Automatizar pipeline de generación de 1 Reel/Short diario con publicación programada.
