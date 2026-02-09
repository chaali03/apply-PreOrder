# 🚀 START HERE - SCAFF*FOOD

## Backend Framework: Fiber (Express.js untuk Golang)

Backend sudah menggunakan **Fiber framework** - framework Go yang sangat mirip dengan Express.js! ✨

## ⚡ Quick Start (3 Langkah)

### 1️⃣ Jalankan Backend
Buka terminal baru:
```bash
cd api
./start.sh
```

Atau langsung:
```bash
cd api
go run main.go
```

### 2️⃣ Jalankan Frontend
Buka terminal lain:
```bash
npm run dev
```

### 3️⃣ Test Login dengan Email OTP
1. Buka browser: http://localhost:3000/login
2. Masukkan email Anda
3. Klik "Kirim Kode"
4. Cek inbox email (atau spam folder)
5. Masukkan kode 6 digit yang diterima
6. Done! 🎉

## 🔧 Verifikasi Backend Running

```bash
curl http://localhost:8080/api/health
```

Harusnya muncul:
```json
{"status":"ok","time":"2025-02-09T..."}
```

## 📧 Jika Email Tidak Masuk

### Cek Spam Folder
Email mungkin masuk ke spam/junk

### Generate Gmail App Password Baru
1. Buka: https://myaccount.google.com/security
2. Aktifkan 2-Step Verification
3. Klik "App passwords"
4. Pilih "Mail" dan "Other device"
5. Copy password baru
6. Update di `api/.env`:
```env
SMTP_PASSWORD=password-baru-dari-google
```
7. Restart backend

### Gunakan Mailtrap (Testing)
1. Daftar gratis: https://mailtrap.io
2. Ambil SMTP credentials
3. Update `api/.env`:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
```
4. Restart backend

## 📚 Dokumentasi Lengkap

- **BACKEND-SETUP.md** - Setup backend lengkap
- **api/README.md** - API documentation
- **api/RUN-BACKEND.md** - Quick start backend
- **api/MANUAL-START.md** - Manual startup guide

## 🎓 Tentang Fiber

- Website: https://gofiber.io
- Fiber = Express.js versi Golang
- Sangat cepat dan mudah digunakan
- Syntax mirip Express.js

### Contoh Code

**Express.js:**
```javascript
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})
```

**Fiber:**
```go
app.Get("/api/health", func(c *fiber.Ctx) error {
  return c.JSON(fiber.Map{"status": "ok"})
})
```

## 📝 Konfigurasi SMTP

File: `api/.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=scafffood@gmail.com
SMTP_PASSWORD=rxzrqlhjjmstyzab
SMTP_FROM=scafffood@gmail.com
PORT=8080
```

## 🎯 Pages yang Sudah Dibuat

- ✅ `/` - Home page
- ✅ `/login` - Login dengan email OTP
- ✅ `/menu` - Menu produk
- ✅ `/kurir` - Tracking pesanan
- ✅ `/locations` - Lokasi dengan Google Maps
- ✅ `/dashboard` - Admin dashboard
- ✅ `/order` - Order & payment (COD, Transfer, QRIS)

## 🚀 Tech Stack

### Frontend
- Next.js 16
- React
- TypeScript
- Custom CSS (retro theme)

### Backend
- Fiber (Go framework)
- SMTP email
- In-memory storage

## 📌 Catatan Penting

- ✅ Backend harus running saat test login
- ✅ Gunakan terminal terpisah untuk backend
- ✅ Kode OTP expire dalam 5 menit
- ✅ Email dikirim via SMTP (bukan popup)
- ✅ Cek logs backend untuk debugging

## 🆘 Troubleshooting

### Backend tidak start?
```bash
# Cek Go terinstall
go version

# Install dependencies
cd api && go mod download

# Cek port 8080
lsof -i :8080
```

### CORS Error?
- Pastikan frontend di http://localhost:3000
- Backend auto-allow CORS untuk localhost

### Email tidak masuk?
- Cek spam folder
- Generate Gmail App Password baru
- Gunakan Mailtrap untuk testing

## 🎉 Selesai!

Backend sudah siap dengan Fiber framework. Tinggal jalankan dan test!

**Happy Coding! 🚀**
