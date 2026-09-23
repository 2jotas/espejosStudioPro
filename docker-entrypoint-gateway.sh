#!/bin/sh
set -e

CERT_DIR="/etc/letsencrypt/live/espejos-studio.mine.bz"
CERT_DIR_PRECIODOLAR="/etc/letsencrypt/live/preciodolarhoy.cl"

apk add --no-cache openssl >/dev/null 2>&1 || true

# Create dummy self-signed SSL cert if Let's Encrypt cert does not exist yet
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    echo "🔑 Generating SSL certificate fallback for espejos-studio.mine.bz..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=espejos-studio.mine.bz" >/dev/null 2>&1 || true
fi

# Create dummy self-signed SSL cert for preciodolarhoy.cl if Origin CA does not exist yet
if [ ! -f "$CERT_DIR_PRECIODOLAR/fullchain.pem" ] || [ ! -f "$CERT_DIR_PRECIODOLAR/privkey.pem" ]; then
    echo "🔑 Generating SSL certificate fallback for preciodolarhoy.cl..."
    mkdir -p "$CERT_DIR_PRECIODOLAR"
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$CERT_DIR_PRECIODOLAR/privkey.pem" \
        -out "$CERT_DIR_PRECIODOLAR/fullchain.pem" \
        -subj "/CN=preciodolarhoy.cl" >/dev/null 2>&1 || true
fi

echo "🚀 Starting Nginx Gateway..."
exec nginx -g 'daemon off;'
