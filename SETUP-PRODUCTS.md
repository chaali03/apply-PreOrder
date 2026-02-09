# 🚀 Setup Products - Quick Guide

## ✅ What's Fixed
1. **Image fallback** - No more empty src errors
2. **Descriptive text** - Already in database schema
3. **API endpoints** - Ready in backend code

## 📋 What You Need to Do

### Step 1: Reset Database
```bash
./reset-database.sh
```
This will load the new schema with:
- Products table with all fields (short_description, description, tag, tag_color, 3 images)
- 2 sample products with full descriptions

### Step 2: Restart Backend
```bash
cd api
./start.sh
```
This will load the new Product model and API endpoints.

### Step 3: Test
Open http://localhost:3000/menu and you should see products from database!

## 📦 Sample Products Included

### 1. Cookies - Rp 5.000
- **Short**: "Cookies panggang maksimal, cokelat lumer, resep rahasia khas kami, empuk dan wangi."
- **Description**: "Cookies premium dengan cokelat chip Belgium yang lumer di mulut. Dibuat dengan resep rahasia keluarga menggunakan butter asli dan gula aren pilihan. Tekstur yang empuk di dalam namun renyah di luar, memberikan pengalaman makan yang sempurna. Cocok untuk teman ngopi atau camilan santai."
- **Tag**: Mantul (#ff4d00)
- **Category**: Snack

### 2. Udang Keju 3pcs - Rp 10.000
- **Short**: "Udang keju dengan isian daging ayam dan udang, dibalut adonan renyah dan keju lumer."
- **Description**: "Perpaduan sempurna antara udang segar dan keju mozzarella yang lumer. Diisi dengan daging ayam cincang berkualitas dan udang pilihan, kemudian dibalut dengan tepung panir renyah. Setiap gigitan memberikan sensasi gurih keju yang creamy berpadu dengan tekstur renyah di luar. Disajikan dalam porsi 3 pieces yang pas untuk sharing atau makan sendiri."
- **Tag**: Wenak (#bff000)
- **Category**: Main Course

## 🎯 What Changed
- Menu page: Fetches from `/api/products` instead of hardcoded data
- Detail page: Fetches from `/api/products/:id` instead of hardcoded data
- Images: Fallback to placeholder if empty
- **No design changes** - Everything looks the same, just data from database now!

## 🔍 Troubleshooting

### Backend not starting?
Check if port 8080 is already in use:
```bash
sudo lsof -i :8080
# Kill the process if needed
sudo kill -9 <PID>
```

### Database not connecting?
Make sure Docker is running:
```bash
sudo systemctl start docker
docker ps  # Should show scafffood-postgres
```

### Products not showing?
1. Check backend: `curl http://localhost:8080/api/products`
2. Check database: `docker exec scafffood-postgres psql -U postgres -d management_preorder -c "SELECT name, price FROM products;"`

That's it! 🎉
