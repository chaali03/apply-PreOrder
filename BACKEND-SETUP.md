# 🚀 BACKEND SETUP - SCAFF*FOOD

## Framework: Fiber (Express.js untuk Golang)

Backend sudah menggunakan **Fiber framework** - framework Go yang sangat mirip dengan Express.js!

## ⚡ Quick Start (Copy-Paste)

### 1. Buka Terminal Baru
```bash
cd api
./start.sh
```

### 2. Test Backend
Buka terminal lain:
```bash
curl http://localhost:8080/api/health
```

Harusnya muncul:
```json
{"status":"ok","time":"2025-02-09T..."}
```

### 3. Test Email OTP
```bash
cd api
./test-api.sh
```

## 📧 Test dari Browser

1. Pastikan backend running (lihat langkah 1)
2. Buka: http://localhost:3000/login
3. Masukkan email Anda
4. Klik "Kirim Kode"
5. Cek inbox email (atau spam folder)
6. Masukkan kode 6 digit yang diterima

## 🎯 Cara Menjalankan Backend

### Opsi 1: Startup Script (Recommended)
```bash
cd api
./start.sh
```

### Opsi 2: Langsung dengan Go
```bash
cd api
go run main.go
```

### Opsi 3: Python Script
```bash
cd api
python3 run_backend.py
```

### Opsi 4: Manual dengan Environment Variables
```bash
cd api
SMTP_HOST=smtp.gmail.com \
SMTP_PORT=587 \
SMTP_USERNAME=scafffood@gmail.com \
SMTP_PASSWORD=rxzrqlhjjmstyzab \
SMTP_FROM=scafffood@gmail.com \
PORT=8080 \
go run main.go
```

## 🔧 Troubleshooting

### ❌ Email tidak masuk ke inbox?

**Solusi 1: Cek Spam Folder**
- Email mungkin masuk ke folder spam/junk
- Tandai sebagai "Not Spam" untuk email berikutnya

**Solusi 2: Generate Gmail App Password Baru**
1. Buka: https://myaccount.google.com/security
2. Aktifkan 2-Step Verification (jika belum)
3. Scroll ke bawah, klik "App passwords"
4. Pilih "Mail" dan "Other device"
5. Copy password yang muncul (16 karakter)
6. Update di `api/.env`:
```env
SMTP_PASSWORD=abcd efgh ijkl mnop
```
7. Restart backend

**Solusi 3: Gunakan Mailtrap (Testing)**
Mailtrap adalah fake SMTP server untuk testing:
1. Daftar gratis di: https://mailtrap.io
2. Buat inbox baru
3. Copy SMTP credentials dari dashboard
4. Update `api/.env`:
```env
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=587
SMTP_USERNAME=your-mailtrap-username
SMTP_PASSWORD=your-mailtrap-password
SMTP_FROM=noreply@scafffood.com
```
5. Restart backend
6. Email akan masuk ke Mailtrap inbox (bukan email asli)

### ❌ Backend tidak bisa start?

**Cek Go terinstall:**
```bash
go version
```
Jika belum, install dari: https://go.dev/dl/

**Install dependencies:**
```bash
cd api
go mod download
```

**Cek port 8080 sudah dipakai:**
```bash
# Linux/Mac
lsof -i :8080

# Jika ada process, kill:
kill -9 <PID>
```

### ❌ CORS Error di browser?

- Pastikan frontend running di http://localhost:3000
- Backend sudah auto-allow CORS untuk localhost:3000 dan localhost:3001
- Restart backend jika masih error

### ❌ "Failed to fetch" di browser?

- Backend belum running → Jalankan backend dulu
- Port salah → Pastikan backend di port 8080
- CORS issue → Cek console browser untuk detail

## 📝 Konfigurasi SMTP Saat Ini

File: `api/.env`
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=scafffood@gmail.com
SMTP_PASSWORD=rxzrqlhjjmstyzab
SMTP_FROM=scafffood@gmail.com
PORT=8080
```

## 🎓 Tentang Fiber Framework

- **Website**: https://gofiber.io
- **Fiber = Express.js versi Golang**
- Sangat cepat (built on top of Fasthttp)
- Syntax mirip Express.js
- Mudah deploy
- Zero memory allocation di routing

### Contoh Code Fiber vs Express.js

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

Lihat? Hampir sama! 🎉

## 📡 API Endpoints

### 1. Health Check
```bash
curl http://localhost:8080/api/health
```

Response:
```json
{
  "status": "ok",
  "time": "2025-02-09T10:30:00Z"
}
```

### 2. Send Verification Code
```bash
curl -X POST http://localhost:8080/api/auth/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

Response:
```json
{
  "success": true,
  "message": "Kode verifikasi telah dikirim ke user@example.com"
}
```

### 3. Verify Code
```bash
curl -X POST http://localhost:8080/api/auth/verify-code \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","code":"123456"}'
```

Response (Success):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "token_user@example.com_1234567890"
}
```

## 📧 Email Template

Email OTP yang dikirim menggunakan template HTML dengan:
- ✅ Branding SCAFF*FOOD dengan logo
- ✅ Kode OTP besar dan jelas (48px, monospace)
- ✅ Warning expire 5 menit dengan icon ⏰
- ✅ Retro design matching website theme
- ✅ Responsive untuk mobile
- ✅ Background color #FDF9F0 (cream)
- ✅ Accent color #bff000 (lime green)

## 📌 Catatan Penting

- ✅ Backend harus tetap running saat test login
- ✅ Gunakan terminal terpisah untuk backend
- ✅ Kode OTP expire dalam 5 menit
- ✅ Kode disimpan di memory (hilang jika restart)
- ✅ Cek logs backend untuk debugging SMTP
- ✅ Email dikirim via SMTP (bukan popup alert)

## 🆘 Cek Logs Backend

Contoh log sukses:
```
🚀 Server starting on http://localhost:8080
📧 SMTP: smtp.gmail.com:587
📨 From: scafffood@gmail.com
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Attempting to send email to user@email.com using SMTP smtp.gmail.com:587
Connecting to SMTP server: smtp.gmail.com:587
Email sent successfully to user@email.com
SUCCESS: Verification code sent to user@email.com
```

Contoh log error:
```
SMTP Error: 535 Authentication failed
ERROR: Failed to send email to user@email.com
Code for user@email.com: 123456 (email failed, showing in logs)
```

## 📚 Dokumentasi Lengkap

- `api/README.md` - Dokumentasi API lengkap
- `api/RUN-BACKEND.md` - Quick start guide
- `api/MANUAL-START.md` - Manual startup guide
- `api/.env.example` - Example environment variables

## 🚀 Deploy ke Production

### Build Binary
```bash
cd api
go build -o scaff-food-api main.go
./scaff-food-api
```

### Docker (Future)
```bash
docker build -t scaff-food-api .
docker run -p 8080:8080 --env-file .env scaff-food-api
```

## 🎉 Selesai!

Backend sudah siap digunakan dengan Fiber framework. Tinggal jalankan dan test!

**Next Steps:**
1. Jalankan backend: `cd api && ./start.sh`
2. Test di browser: http://localhost:3000/login
3. Cek email inbox untuk kode OTP
4. Enjoy! 🎊
