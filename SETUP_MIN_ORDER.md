# Setup Minimal Order Feature

## Langkah-langkah Setup:

### 1. Jalankan Database
```bash
./start-db.sh
```

### 2. Jalankan Migration untuk Menambah Kolom min_order
```bash
./add-min-order.sh
```

Atau manual:
```bash
cat api/migrations/003_add_min_order.sql | docker exec -i scafffood-postgres psql -U postgres -d scafffood
```

### 3. Restart API Server
```bash
# Stop API server (Ctrl+C)
# Kemudian jalankan lagi
cd api
go run main.go
```

### 4. Test Fitur

#### Di Dashboard Admin:
1. Buka http://localhost:3000/dashboard/menu
2. Edit produk (misal: Cookies)
3. Set "Minimal Order" ke 3
4. Save

#### Di Customer Menu:
1. Buka http://localhost:3000/menu
2. Klik produk yang sudah di-set min_order
3. Quantity akan otomatis dimulai dari 3
4. Button minus disabled sampai quantity = 3
5. Tampil info "Min. order: 3 pcs"

## Troubleshooting

### Quantity masih 1 padahal sudah set min_order:
- Pastikan migration sudah dijalankan
- Cek database: `docker exec scafffood-postgres psql -U postgres -d scafffood -c "SELECT name, min_order FROM products;"`
- Pastikan API server sudah di-restart setelah migration
- Clear browser cache atau hard refresh (Ctrl+Shift+R)

### Migration error:
- Pastikan Docker running: `docker ps`
- Pastikan database container running: `docker ps | grep scafffood-postgres`
- Jika belum running, jalankan: `./start-db.sh`

## Cara Kerja:

1. **Database**: Kolom `min_order` di tabel `products` (default: 1)
2. **API**: Field `MinOrder` di Product struct, otomatis return ke frontend
3. **Dashboard**: Admin bisa set minimal order per produk
4. **Customer**: 
   - Quantity awal = min_order
   - Tidak bisa order kurang dari min_order
   - Button minus disabled jika quantity = min_order
