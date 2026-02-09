# 🔧 Fix Category "Cookies" → "Snack"

## Masalah
Website masih menampilkan kategori "Cookies" padahal seharusnya "Snack"

## Penyebab
Data di database belum di-update atau backend belum di-restart setelah update schema

## ✅ Solusi Lengkap

### Step 1: Start Docker (jika belum)
```bash
sudo systemctl start docker
```

### Step 2: Start Database
```bash
docker-compose up -d
```

Atau jika ada script:
```bash
./start-db.sh
```

### Step 3: Reset Database (Load Schema Baru)
```bash
./reset-database.sh
```

Ketik `yes` untuk konfirmasi.

Script ini akan:
- Drop semua tables lama
- Buat tables baru
- Hapus produk dengan kategori "Cookies" yang salah
- Insert data baru dengan kategori yang benar:
  - **Cookies** → kategori: **Snack** ✅
  - **Udang Keju 3pcs** → kategori: **Main Course** ✅

### Step 4: Restart Backend
```bash
cd api
./start.sh
```

Atau manual:
```bash
cd api
go run main.go
```

### Step 5: Hard Refresh Browser
Tekan **Ctrl + Shift + R** (atau Cmd + Shift + R di Mac) untuk hard refresh dan clear cache.

## 🔍 Verifikasi

### Cek Database
```bash
docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT name, category FROM products;"
```

Harusnya output:
```
     name        |  category   
-----------------+-------------
 Cookies         | Snack
 Udang Keju 3pcs | Main Course
```

### Cek API
```bash
curl http://localhost:8080/api/products
```

Harusnya response JSON dengan `"category": "Snack"` untuk Cookies.

### Cek Website
Buka http://localhost:3000/menu dan klik produk Cookies.
Di atas nama produk seharusnya tampil **"SNACK"** bukan "COOKIES".

## 🚨 Troubleshooting

### Database tidak start?
```bash
sudo systemctl start docker
docker-compose up -d
docker ps  # Cek apakah scafffood-postgres running
```

### Backend error?
```bash
cd api
cat .env  # Pastikan DB_HOST, DB_PORT, dll sudah benar
go run main.go  # Lihat error message
```

### Website masih tampil "Cookies"?
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear browser cache
3. Buka DevTools (F12) → Network tab → Disable cache
4. Refresh lagi

## 📝 Data yang Benar di Database

```sql
-- Cookies
name: 'Cookies'
category: 'Snack'  ← BUKAN 'Cookies'
tag: 'Mantul'
tag_color: '#ff4d00'

-- Udang Keju
name: 'Udang Keju 3pcs'
category: 'Main Course'
tag: 'Wenak'
tag_color: '#bff000'
```

Setelah semua langkah di atas, kategori akan tampil dengan benar! ✅
