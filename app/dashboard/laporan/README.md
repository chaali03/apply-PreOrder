# 📊 Halaman Laporan Keuangan

Halaman laporan keuangan lengkap dengan visualisasi data dan fitur export.

## ✨ Fitur

### 1. Dashboard Summary
- Total Revenue
- Total Orders
- Total Produk Terjual
- Rata-rata Nilai Order

### 2. Visualisasi Data (Charts)
- **Bar Chart**: Penjualan per produk (revenue & quantity)
- **Pie Chart**: Distribusi revenue per produk
- **Line Chart**: Tren penjualan harian

### 3. Filter Tanggal
- Filter berdasarkan range tanggal
- Default: 30 hari terakhir

### 4. Export Data
- **Export Excel**: Multi-sheet (Ringkasan, Penjualan Produk, Penjualan Harian)
- **Export Word**: Laporan lengkap dengan tabel

### 5. Download Chart
- Download setiap chart sebagai gambar PNG
- Klik tombol "📥 Download" pada setiap chart

### 6. Tabel Detail
- Detail penjualan per produk
- Total dan rata-rata per order

## 🛠️ Teknologi

- **Recharts**: Library untuk visualisasi chart
- **XLSX**: Export ke Excel
- **html2canvas**: Capture chart sebagai gambar
- **FileSaver**: Download file

## 📡 API Endpoint

```
GET /api/reports?start_date=2024-01-01&end_date=2024-12-31
```

Response:
```json
{
  "total_revenue": 1000000,
  "total_orders": 50,
  "total_products_sold": 200,
  "average_order_value": 20000,
  "product_sales": [...],
  "daily_sales": [...]
}
```

## 🎨 Styling

File CSS: `laporan.css`
- Gradient background
- Card-based layout
- Responsive design
- Hover effects
- Mobile-friendly

## 🚀 Cara Akses

1. Login ke dashboard
2. Klik "Lihat Laporan" di Quick Actions
3. Atau akses langsung: `/dashboard/laporan`
