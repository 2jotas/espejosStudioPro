#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "=========================================="
echo "🚀 Deploying Espejos Studio to VPS..."
echo "=========================================="

# 1. Pull latest changes from git
echo "📥 Pulling latest code from GitHub..."
git pull origin main

# 2. Build Docker images for production
echo "🔨 Building production Docker containers..."
docker compose -f infra/docker-compose.prod.yml build

# 3. Start services in background
echo "⚡ Starting containers in daemon mode..."
docker compose -f infra/docker-compose.prod.yml up -d

# 4. Run Prisma database migrations
echo "🗄️ Running database migrations..."
docker compose -f infra/docker-compose.prod.yml exec api npx prisma migrate deploy

echo "=========================================="
echo "✅ Espejos Studio Deployed Successfully!"
echo "=========================================="
