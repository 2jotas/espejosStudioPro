# Espejos — CRM de Agendamiento & Fidelización para Profesionales

> **Refleja tu mejor versión.**

Espejos es un CRM de agendamiento online + ficha técnica de cliente inteligente para profesionales independientes y de salones (peluquería, barbería, estética, uñas, spa, etc.).

---

## Stack Tecnológico & Justificación de Arquitectura

- **Backend (Node.js + Fastify + TypeScript)**: Seleccionado por ser ultraliviano, de alto rendimiento y ofrecer baja latencia para el wizard de reserva pública en dispositivos móviles.
- **Frontend (React + Vite + TypeScript + TailwindCSS)**: Monolito modular de cliente único que renderiza tanto el landing/wizard público como el panel de administración según la sesión y la ruta `/{slug}`.
- **Base de Datos (PostgreSQL + Prisma ORM)**: Dominio estrictamente relacional (profesionales, clientes, servicios, citas) con migraciones versionadas y seguridad de tipos end-to-end.
- **Cache & Sesiones (Redis)**: Manejo de sesiones de usuario, ratelimit de reserva y cache de disponibilidad de Google Calendar.
- **Autenticación**:
  - **Profesionales**: Email/Password (hasheado con Argon2id) + JWT HttpOnly + Refresh Token.
  - **Clientes**: Passkeys / WebAuthn (`@simplewebauthn`) como método preferente sin contraseñas + OTP SMS como fallback.
- **Contenedores & DevOps**: Docker + Docker Compose en desarrollo local y producción sobre VPS Linux.

---

## Estructura del Monorepo

```
espejos/
├── apps/
│   ├── api/                  # Backend Fastify + Prisma ORM
│   └── web/                  # Frontend React + Vite + TailwindCSS
├── packages/
│   └── shared-types/         # Tipos e interfaces TypeScript compartidas
├── infra/
│   └── docker-compose.yml    # Configuración de contenedores (Postgres, Redis, API, Web)
├── .env.example
└── README.md
```

---

## Instrucciones para Ejecutar en Desarrollo Local

### Requisitos Previos
- Node.js >= 20.x
- Docker & Docker Compose

### Pasos
1. Clonar el repositorio y copiar el archivo de variables de entorno:
   ```bash
   cp .env.example .env
   ```

2. Instalar dependencias en el monorepo:
   ```bash
   npm install
   ```

3. Construir los paquetes compartidos:
   ```bash
   npm run build --workspace=packages/shared-types
   ```

4. Levantamiento de servicios con Docker Compose:
   ```bash
   docker compose -f infra/docker-compose.yml up -d --build
   ```

5. Verificación de servicios:
   - **Frontend Web**: [http://localhost:5173](http://localhost:5173)
   - **API Healthcheck**: [http://localhost:3000/health](http://localhost:3000/health)
