# Fitur Pembatalan Order dengan Alasan

## Lokasi Fitur
**Halaman**: Dashboard Orders  
**URL**: http://localhost:3000/dashboard/orders

## Cara Menggunakan

### 1. Login ke Admin
- Buka: http://localhost:3000/login
- Email: `scafffood@gmail.com`
- Masukkan kode verifikasi (lihat di console API server)

### 2. Buka Halaman Orders
- Klik menu "Pesanan" di sidebar
- Atau langsung ke: http://localhost:3000/dashboard/orders

### 3. Batalkan Order
1. Cari order yang ingin dibatalkan
2. Di bagian bawah order card, ada dropdown "Status"
3. Ubah status dari (misal: "Pending") ke **"Dibatalkan"**
4. Modal akan muncul otomatis

### 4. Isi Alasan Pembatalan
Modal yang muncul berisi:
- **Judul**: "Batalkan Pesanan"
- **Info Order**: Nomor order, customer, total
- **Form Textarea**: "Alasan Pembatalan *" (wajib diisi)
- **Placeholder**: "Contoh: Stok habis, Customer request, dll..."
- **Info**: "Alasan akan ditampilkan ke customer dan pesanan akan otomatis terhapus setelah 24 jam"
- **Button**: "Batal" dan "Ya, Batalkan Pesanan"

### 5. Submit
- Isi alasan pembatalan (minimal 1 karakter)
- Klik "Ya, Batalkan Pesanan"
- Order status berubah menjadi "Dibatalkan"
- Alasan tersimpan di database

## Tampilan di Customer

### Halaman Kurir (Track Order)
Customer yang track order akan melihat:
- Box kuning dengan border merah
- Icon warning
- **"Alasan Pembatalan:"** [alasan dari admin]
- Note: "Pesanan ini akan otomatis terhapus 24 jam setelah dibatalkan"

**URL**: http://localhost:3000/kurir?phone=08123456789

## Auto-Delete

Order yang dibatalkan akan **otomatis terhapus** setelah 24 jam.

**Kapan dihapus?**
- Saat admin fetch orders di dashboard
- Saat customer track order di halaman kurir
- Background check dilakukan setiap kali endpoint `/api/orders` dipanggil

**Log di Console API**:
```
🗑️ Auto-deleted 2 cancelled orders older than 24 hours
```

## Validasi

### Backend (API)
- Status "dibatalkan" **wajib** ada `cancellation_reason`
- Jika tidak ada, return error: "Alasan pembatalan harus diisi"
- `cancelled_at` otomatis di-set ke waktu sekarang

### Frontend (Dashboard)
- Button "Ya, Batalkan Pesanan" disabled jika textarea kosong
- Opacity 0.5 saat disabled, 1 saat enabled
- Modal tidak bisa di-submit tanpa alasan

## Database Schema

```sql
-- Kolom baru di tabel orders
ALTER TABLE orders ADD COLUMN cancellation_reason TEXT;
ALTER TABLE orders ADD COLUMN cancelled_at TIMESTAMP;
```

**Migration**: `api/migrations/004_add_cancellation_fields.sql`

**Cara menjalankan**:
```bash
./add-cancellation-fields.sh
```

## Troubleshooting

### Modal tidak muncul
**Penyebab**: JavaScript error atau state tidak ter-update

**Solusi**:
1. Buka browser console (F12)
2. Cek error
3. Hard refresh (Ctrl+Shift+R)
4. Clear cache

### Alasan tidak tampil di customer
**Penyebab**: 
- Migration belum dijalankan
- API server belum di-restart setelah migration

**Solusi**:
```bash
# Jalankan migration
./add-cancellation-fields.sh

# Restart API server
cd api
# Ctrl+C untuk stop
go run main.go
```

### Order tidak auto-delete setelah 24 jam
**Penyebab**: Endpoint `/api/orders` belum dipanggil

**Solusi**:
- Auto-delete hanya terjadi saat fetch orders
- Buka dashboard orders atau halaman kurir untuk trigger delete
- Atau buat cron job untuk panggil endpoint secara berkala

## Contoh Alasan Pembatalan

**Baik**:
- "Stok produk habis, tidak bisa memenuhi pesanan"
- "Customer request pembatalan via telepon"
- "Alamat pengiriman di luar jangkauan"
- "Produk rusak/cacat, tidak layak kirim"

**Kurang Baik**:
- "Dibatalkan" (terlalu singkat)
- "Cancel" (tidak informatif)
- "-" (tidak jelas)

## File Terkait

- **Backend**: `api/main.go` (Order struct, update status endpoint, auto-delete)
- **Frontend Dashboard**: `app/dashboard/orders/page.tsx` (modal, form, submit)
- **Frontend Customer**: `app/kurir/page.tsx` (tampilan alasan)
- **CSS**: `app/kurir/kurir.css` (styling box alasan)
- **Migration**: `api/migrations/004_add_cancellation_fields.sql`
