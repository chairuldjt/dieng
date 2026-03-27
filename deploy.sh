#!/bin/bash

# --- Pesona Dieng Deployment Script ---
echo "----------------------------------------"
echo "🚀 Memulai Proses Deployment..."
echo "----------------------------------------"

# 1. Bersihkan Cache (Opsional)
# echo "🧹 Membersihkan folder build lama..."
# rm -rf .next

# 2. Tambahkan semua perubahan
echo "📝 Menambahkan perubahan ke Git..."
git add .

# 3. Commit dengan pesan otomatis atau custom
if [ -z "$1" ]; then
    MESSAGE="Update: $(date +'%Y-%m-%d %H:%M:%S')"
else
    MESSAGE="$1"
fi
git commit -m "$MESSAGE"

# 4. Push ke GitHub
echo "📤 Mengirim kode ke repositori utama..."
git push origin master

echo "----------------------------------------"
echo "✅ Berhasil! Kode Anda kini sinkron di GitHub."
echo "----------------------------------------"
