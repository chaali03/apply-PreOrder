# Deploy Backend ke Railway - Solusi Permanent URL

## Kenapa Railway?

Cloudflare Tunnel **TIDAK COCOK** untuk production karena:
- ❌ URL berubah setiap restart
- ❌ Tidak stabil, sering mati
- ❌ Harus manual update Vercel setiap kali URL berubah
- ❌ Tidak ada uptime guarantee

Railway memberikan:
- ✅ **URL permanent** yang tidak pernah berubah
- ✅ Auto-deploy dari Git
- ✅ Free tier $5/month credit
- ✅ PostgreSQL database included
- ✅ 99.9% uptime

---

## Step-by-Step Deployment

### 1. Install Railway CLI

```bash
npm install -g @railway/cli
```

### 2. Login ke Railway

```bash
railway login
```

Browser akan terbuka, login dengan GitHub.

### 3. Initialize Project

```bash
railway init
```

Pilih:
- "Create new project"
- Nama project: `scaff-food-backend`

### 4. Add PostgreSQL Database

```bash
railway add --database postgres
```

### 5. Set Environment Variables

```bash
# Database akan auto-set oleh Railway
# Kita hanya perlu set PORT
railway variables --set PORT=8080
```

### 6. Deploy!

```bash
railway up
```

Tunggu 2-3 menit untuk build dan deploy.

### 7. Get Your Permanent URL

```bash
railway domain
```

Atau buat custom domain:
```bash
railway domain --generate
```

Anda akan mendapat URL seperti:
`https://scaff-food-backend-production.up.railway.app`

**URL ini PERMANENT dan tidak akan pernah berubah!**

### 8. Update Vercel Environment Variable

```bash
# Ganti dengan URL Railway Anda
export RAILWAY_URL="https://scaff-food-backend-production.up.railway.app"

# Update Vercel
vercel env rm NEXT_PUBLIC_API_URL production --yes
echo "$RAILWAY_URL" | vercel env add NEXT_PUBLIC_API_URL production

# Redeploy
vercel --prod --yes
```

### 9. Update .env.production

```bash
echo "NEXT_PUBLIC_API_URL=$RAILWAY_URL" > .env.production
```

---

## Database Migration

Railway akan auto-create PostgreSQL. Untuk run migrations:

```bash
# Connect ke Railway database
railway connect postgres

# Atau run migrations via API
# Migrations akan auto-run saat startup (lihat api/cmd/main.go)
```

---

## Monitoring

```bash
# View logs
railway logs

# Check status
railway status

# Open dashboard
railway open
```

---

## Auto-Deploy dari Git

Setelah setup, setiap `git push` akan otomatis deploy ke Railway!

```bash
git add .
git commit -m "Update backend"
git push
```

Railway akan auto-detect changes dan redeploy.

---

## Troubleshooting

### Build Error: Go Version

Jika error "go.mod requires go >= X.X.X":

1. Check `api/go.mod` - pastikan Go version valid (1.23 atau 1.22)
2. Check `Dockerfile` - pastikan match dengan go.mod
3. Redeploy: `railway up`

### Database Connection Error

```bash
# Check database variables
railway variables

# Should see:
# DATABASE_URL=postgresql://...
# PGHOST=...
# PGPORT=5432
# PGUSER=postgres
# PGPASSWORD=...
# PGDATABASE=railway
```

### Port Binding Error

Railway auto-sets `PORT` environment variable. Pastikan `api/main.go` menggunakan:

```go
port := os.Getenv("PORT")
if port == "" {
    port = "8080"
}
app.Listen(":" + port)
```

---

## Cost Estimate

Railway Free Tier:
- $5 credit per month
- ~500 hours runtime
- 1GB RAM
- 1GB storage

Untuk app ini (backend + database):
- Estimated: $3-4/month
- **Cukup untuk development dan demo!**

---

## Next Steps After Railway Deploy

1. ✅ Get permanent Railway URL
2. ✅ Update Vercel env variable
3. ✅ Redeploy Vercel
4. ✅ Test app - URL tidak akan berubah lagi!
5. ✅ Stop Cloudflare Tunnel (tidak perlu lagi)
6. ✅ Remove tunnel scripts (optional)

---

## Quick Commands Reference

```bash
# Deploy
railway up

# View logs
railway logs

# Open dashboard
railway open

# Get URL
railway domain

# Set variable
railway variables --set KEY=VALUE

# Connect to database
railway connect postgres

# Restart service
railway restart
```

---

## Support

Railway Docs: https://docs.railway.app
Railway Discord: https://discord.gg/railway
