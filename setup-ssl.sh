#!/bin/bash
# Script de activación de HTTPS / SSL con Let's Encrypt para Espejos Studio Pro

DOMAIN="espejos-studio.mine.bz"
EMAIL="2jota27@gmail.com"

echo "🔐 Generando certificado SSL gratuito Let's Encrypt para $DOMAIN..."

mkdir -p ./certbot/conf ./certbot/www

# Iniciar gateway temporal para verificación HTTP ACME
docker compose up -d espejos-gateway

# Solicitar certificado SSL a Let's Encrypt
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
  --non-interactive

# Reconstruir contenedores con SSL activo
docker compose down
docker compose up -d --build

echo "✅ Certificado HTTPS activado exitosamente para https://$DOMAIN"
