#!/bin/bash

# --- Pesona Dieng Server Deployment Script ---
echo "----------------------------------------"
echo "🚀 Memulai Update Website di Server..."
echo "----------------------------------------"

# 1. Tarik kode terbaru dari GitHub
echo "📡 Menarik perubahan terbaru dari GitHub..."
git pull origin master

# 2. Instal dependensi (jika ada perubahan di package.json)
echo "📦 Menginstal dependensi baru..."
npm install

# 3. Build ulang proyek Next.js
echo "🏗️  Membangun ulang (Building) aplikasi..."
npm run build

# 4. Restart server (Opsional, jika memakai PM2)
# echo "♻️  Me-restart aplikasi (PM2)..."
# pm2 restart dieng || pm2 start npm --name "dieng" -- start

echo "----------------------------------------"
echo "✅ Berhasil! Website Anda kini sudah versi terbaru."
echo "----------------------------------------"
