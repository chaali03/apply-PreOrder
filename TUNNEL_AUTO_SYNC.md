# Cloudflare Tunnel Auto-Sync untuk Vercel

## Masalah
Cloudflare Tunnel free tier mengubah URL setiap kali restart, menyebabkan Vercel menggunakan URL lama dan aplikasi tidak bisa connect ke backend.

## Solusi
3 script otomatis untuk sync URL tunnel ke Vercel:

---

## 🚀 Quick Sync (Recommended)

Gunakan ini ketika URL tunnel berubah dan perlu update cepat:

```bash
./sync-tunnel-now.sh
```

Script ini akan:
1. Deteksi URL tunnel saat ini
2. Update `.env.production`
3. Update Vercel environment variable
4. Trigger redeploy Vercel

**Waktu:** ~2-3 menit total (termasuk deployment)

---

## 👀 Auto-Watch Mode

Jalankan script ini di background untuk monitoring otomatis:

```bash
./watch-tunnel.sh
```

Script ini akan:
- Monitor URL tunnel setiap 30 detik
- Otomatis update Vercel ketika URL berubah
- Berjalan terus sampai di-stop (Ctrl+C)

**Gunakan ini jika:** Tunnel sering restart dan Anda ingin auto-sync tanpa manual intervention.

---

## 🔧 Manual Update

Jika perlu kontrol penuh:

```bash
./auto-update-vercel.sh
```

---

## Prerequisites

1. **Vercel CLI** (akan auto-install jika belum ada):
   ```bash
   npm install -g vercel
   ```

2. **Login ke Vercel**:
   ```bash
   vercel login
   ```

3. **Link project** (jika belum):
   ```bash
   vercel link
   ```

---

## Workflow Recommended

### Saat Development:

1. Start tunnel:
   ```bash
   docker-compose up -d
   ```

2. Sync ke Vercel:
   ```bash
   ./sync-tunnel-now.sh
   ```

3. (Optional) Start auto-watch di terminal terpisah:
   ```bash
   ./watch-tunnel.sh
   ```

### Saat Tunnel Restart:

Jika tunnel restart dan URL berubah:

```bash
./sync-tunnel-now.sh
```

Tunggu 1-2 menit, refresh browser.

---

## Troubleshooting

### "Could not detect Cloudflare Tunnel URL"

```bash
# Check tunnel status
docker ps | grep cloudflared

# Restart tunnel
docker-compose restart cloudflared

# Wait 5 seconds
sleep 5

# Try sync again
./sync-tunnel-now.sh
```

### "Vercel CLI not found"

```bash
npm install -g vercel
vercel login
```

### "URLs don't match after sync"

Tunggu 1-2 menit untuk Vercel deployment selesai, lalu refresh browser dengan hard reload (Ctrl+Shift+R).

---

## Alternative: Deploy ke Railway

Untuk menghindari masalah URL yang berubah-ubah, pertimbangkan deploy backend ke Railway untuk mendapatkan permanent URL.

Lihat: `RAILWAY_DEPLOY.md`

---

## Files

- `sync-tunnel-now.sh` - Quick sync (paling sering dipakai)
- `watch-tunnel.sh` - Auto-monitor mode
- `auto-update-vercel.sh` - Core update logic
- `.env.production` - Production environment variables

---

## Tips

1. Bookmark URL Vercel dashboard untuk monitor deployment
2. Gunakan `watch-tunnel.sh` saat demo/presentation
3. Untuk production, gunakan Railway (permanent URL)
