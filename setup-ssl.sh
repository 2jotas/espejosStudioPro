#!/bin/bash
# Script de activación de HTTPS / SSL con Let's Encrypt para Espejos Studio Pro

DOMAIN="espejos-studio.mine.bz"
EMAIL="2jota27@gmail.com"

echo "🔐 Configurando infraestructura SSL para $DOMAIN..."

CERT_DIR="./certbot/conf/live/$DOMAIN"
mkdir -p "$CERT_DIR" ./certbot/www

# Crear certificado temporal autofirmado si no existe para evitar que Nginx falle al arrancar
if [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "🔑 Generando certificado temporal inicial..."
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=$DOMAIN" 2>/dev/null
fi

# Arrancar gateway para verificación HTTP ACME
docker compose up -d espejos-gateway

echo "🌐 Solicitando certificado oficial Let's Encrypt..."
docker run --rm \
  -v "$(pwd)/certbot/conf:/etc/letsencrypt" \
  -v "$(pwd)/certbot/www:/var/www/certbot" \
  certbot/certbot certonly \
  --webroot \
  --webroot-path=/var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email \
  --force-renewal \
  --non-interactive

# Recargar Nginx con el nuevo certificado
docker exec espejos-gateway nginx -s reload 2>/dev/null || docker compose restart espejos-gateway

echo "✅ Certificado HTTPS oficial activado exitosamente para https://$DOMAIN"
