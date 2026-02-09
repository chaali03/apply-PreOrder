# Setup QRIS Payment

## Cara Upload Foto QRIS:

1. **Siapkan foto QR Code QRIS Anda**
   - Format: JPG, PNG, atau JPEG
   - Ukuran rekomendasi: 500x500px atau lebih
   - Pastikan QR code terlihat jelas

2. **Upload foto ke folder public**
   - Letakkan file di: `public/qris-code.jpg`
   - Atau bisa juga: `public/qris-code.png`

3. **Jika menggunakan format PNG**
   - Edit file `app/order/page.tsx`
   - Ubah baris: `src="/qris-code.jpg"` 
   - Menjadi: `src="/qris-code.png"`

## Contoh Struktur File:

```
public/
├── qris-code.jpg          ← Upload foto QRIS Anda di sini
├── icon.svg
├── placeholder-logo.svg
└── produk/
    ├── Cookies.jpeg
    └── UdangKeju.jpeg
```

## Fitur QRIS di Halaman Order:

✅ Menampilkan foto QR code
✅ Instruksi scan
✅ Badge aplikasi pembayaran (GoPay, OVO, Dana, ShopeePay)
✅ Total pembayaran yang jelas
✅ Fallback placeholder jika foto belum diupload
✅ Responsive untuk mobile & desktop

## Testing:

1. Buka halaman: `http://localhost:3000/order`
2. Pilih metode pembayaran "QRIS"
3. Foto QR code akan muncul jika sudah diupload
4. Jika belum, akan muncul placeholder dengan instruksi

## Tips:

- Gunakan foto QR code dengan background putih/terang
- Pastikan QR code tidak terpotong
- Test scan dengan aplikasi pembayaran untuk memastikan QR code valid
- Ukuran file sebaiknya < 500KB untuk loading cepat
