# 🧠 GEMINI / ANTIGRAVITY PROJECT CONTEXT & RULES

Bienvenido, Antigravity. Este proyecto es **Espejos Studio Pro**, un ecosistema integral de barbería de autor, visagismo morfológico con IA, CRM y plataforma de formación en Ciencia de Datos.

---

## 📌 Fuente Única de Verdad (Single Source of Truth)
Antes de proponer cambios, consultar o continuar tareas, lee y respeta siempre:
- **[PROJECT_BRAIN.md](./PROJECT_BRAIN.md)**: Contiene la arquitectura completa, visión estratégica acordada con Grok AI, Golden Guardrails, historial de cambios de agentes y el punto exacto de continuación.

---

## 🏛️ Arquitectura de 3 Capas
1. **Taller (Dynabook Local - Laptop con 32GB RAM / i7)**: Antigravity, entorno de desarrollo local, pruebas y Vault de Obsidian.
2. **Fuente de Verdad (GitHub Privado)**: Repositorios `2jotas/espejosStudioPro` y `2jotas/formacion-ciencia-datos`.
3. **Fábrica 24/7 (VPS Contabo)**: Contenedores Docker (web, API, PostgreSQL, Redis, Gateway Nginx, Hermes Daemon bot `@hermejon` y Syncthing).

---

## 💈 Los 4 Pilares del Proyecto
1. **Landing & Visagismo (`espejosstudio.cl`)**: Web comercial, catálogo de cortes y agendamiento online.
2. **CRM Giovanni (`app.espejosstudio.cl`)**: Gestión de citas, visagismo morfológico con inpainting IA y Passkeys.
3. **Plataforma Formación (`formacion.espejosstudio.cl`)**: Vault interactivo de 4 años de Ciencia de Datos sincronizado mediante Syncthing.
4. **Fábrica de Contenido**: Automatización de guiones diarios y copywriting con `agente_contenido`.

---

## 🛡️ Reglas y Guardrails Obligatorios
1. **Puertos Web**: `espejos-gateway` DEBE mapear SIEMPRE `80:80` y `443:443` hacia Cloudflare. Nunca usar 8080/8443 en `docker-compose.yml`.
2. **Acceso SSH**: Solo mediante Tailscale (`100.93.160.96`), puerto 22 cerrado al internet público.
3. **Secretos**: No commitear variables sensibles o tokens de API en texto plano; usar variables de entorno en `.env`.
4. **Memoria Viva**: Cada vez que se culmine un sprint o cambio relevante, registrarlo en la tabla de cambios de `PROJECT_BRAIN.md` y actualizar la fase actual.
