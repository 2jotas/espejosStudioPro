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
│   ├── docker-compose.yml     # Configuración local de desarrollo
│   ├── docker-compose.prod.yml# Configuración de producción para VPS
│   ├── nginx/
│   │   └── espejos.conf      # Reverse Proxy Nginx & Rate Limiting
│   └── scripts/
│       └── deploy.sh         # Script automatizado de actualización en 1 toque
├── .env.example
└── README.md
```

---

## Guía de Despliegue en VPS (Producción por primera vez)

### 1. Clonar el repositorio en el VPS
```bash
git clone https://github.com/tu-usuario/espejos.git /var/www/espejos
cd /var/www/espejos
```

### 2. Configurar el archivo `.env` de producción
Copia `.env.example` y define credenciales seguras de producción:
```bash
cp .env.example .env
nano .env
```
Asegúrate de ajustar `JWT_SECRET`, `POSTGRES_PASSWORD`, y credenciales de Google OAuth.

### 3. Otorgar permisos de ejecución al script de despliegue
```bash
chmod +x infra/scripts/deploy.sh
```

### 4. Ejecutar el primer despliegue
```bash
./infra/scripts/deploy.sh
```

---

## Actualización Día a Día en el VPS

Cada vez que subas cambios a la rama `main` en GitHub, conéctate por SSH al VPS y ejecuta:
```bash
cd /var/www/espejos
./infra/scripts/deploy.sh
```

---

## Configuración de SSL Gratis con Certbot (Let's Encrypt)

```bash
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d espejos.cl -d www.espejos.cl
```

---

## Copias de Seguridad Automáticas de PostgreSQL (Cronjob)

Para programar un backup diario a las 03:00 AM:
```bash
crontab -e
```
Agrega la siguiente línea:
```cron
0 3 * * * docker exec espejos_postgres_prod pg_dump -U espejos_user espejos_db | gzip > /backups/db_espejos_$(date +\%Y\%m\%d).sql.gz
```
