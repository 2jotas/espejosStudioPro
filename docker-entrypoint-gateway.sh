#!/bin/sh
set -e

CERT_DIR="/etc/letsencrypt/live/espejos-studio.mine.bz"

# Create dummy self-signed SSL cert if Let's Encrypt cert does not exist yet
if [ ! -f "$CERT_DIR/fullchain.pem" ] || [ ! -f "$CERT_DIR/privkey.pem" ]; then
    echo "🔑 Generating fallback SSL certificate for espejos-studio.mine.bz..."
    mkdir -p "$CERT_DIR"
    apk add --no-cache openssl >/dev/null 2>&1 || true
    openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
        -keyout "$CERT_DIR/privkey.pem" \
        -out "$CERT_DIR/fullchain.pem" \
        -subj "/CN=espejos-studio.mine.bz" >/dev/null 2>&1 || true
fi

echo "🚀 Starting Nginx Gateway..."
exec nginx -g 'daemon off;'
