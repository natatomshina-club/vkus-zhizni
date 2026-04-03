#!/bin/bash
set -e

echo "🔄 Обновление системы..."
apt update && apt upgrade -y

echo "🐳 Установка Docker..."
apt install -y ca-certificates curl gnupg lsb-release

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  > /etc/apt/sources.list.d/docker.list

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo "🌐 Установка Nginx..."
apt install -y nginx

echo "🔒 Установка Certbot..."
apt install -y certbot python3-certbot-nginx

echo "📁 Создание папок приложения..."
mkdir -p /opt/vkus-zhizni
mkdir -p /opt/backups

echo "⚙️ Автозапуск Docker..."
systemctl enable docker
systemctl start docker

echo "✅ Сервер готов к деплою"
