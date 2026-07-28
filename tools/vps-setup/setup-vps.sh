#!/bin/bash
# -----------------------------------------------------------------------------
# Visriva Live Station — Ubuntu VPS Setup Script for Evolution API
# Run this on your fresh Ubuntu 22.04 / 24.04 VPS server
# -----------------------------------------------------------------------------

set -e

echo "🚀 Starting Visriva Evolution API Installation..."

# 1. Update packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx certbot python3-certbot-nginx docker.io docker-compose

# 2. Start & Enable Docker
sudo systemctl enable --now docker
sudo usermod -aG docker $USER

# 3. Create app directory
mkdir -p /opt/visriva-wa
cd /opt/visriva-wa

# 4. Pull docker-compose.yml
echo "📦 Setting up Docker Compose..."

# 5. Start containers
sudo docker-compose up -d

echo "✅ Evolution API is running locally on port 8080!"
echo "👉 Follow Nginx setup to map https://api.visriva.com with SSL."
