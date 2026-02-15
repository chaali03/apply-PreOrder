# Deployment Steps for Production

## Changes Made (Ready to Deploy)

### 1. API Proxy Route Created
- ✅ `app/api/[...path]/route.ts` - Forwards all `/api/*` requests to backend
- ✅ Handles GET, POST, PUT, PATCH, DELETE, OPTIONS methods
- ✅ Fixed for Next.js 15 (async params)

### 2. Frontend Updated
- ✅ `lib/fetch-api.ts` - Now uses Next.js API proxy instead of config.json
- ✅ `app/menu/page.tsx` - Fixed image paths to use public folder
- ✅ `app/menu/[id]/page.tsx` - Fixed image paths to use public folder
- ✅ Deleted `public/config.json` - No longer needed

### 3. Backend Infrastructure
- ✅ Docker backend configured
- ✅ Cloudflare Tunnel configured: `api.scafffood.my.id`
- ✅ `cloudflared-config.yml` created

## Deployment Instructions

### Step 1: Set Environment Variable in Vercel
Go to Vercel Dashboard → scaff-food project → Settings → Environment Variables

Add this variable:
```
BACKEND_API_URL=https://api.scafffood.my.id
```

Apply to: Production, Preview, Development

### Step 2: Push Code to GitHub
```bash
git add .
git commit -m "Fix: Add API proxy route, remove config.json, fix image paths"
git push
```

### Step 3: Wait for Vercel Auto-Deploy
Vercel will automatically deploy when you push to GitHub (2-3 minutes)

### Step 4: Ensure Backend is Running
```bash
# Check if Docker containers are running
docker-compose ps

# If not running, start them
docker-compose up -d

# Verify backend is accessible
curl http://localhost:8080/api/health

# Verify tunnel is working
curl https://api.scafffood.my.id/api/health
```

### Step 5: Test Production Site
Visit: https://scafffood.my.id/menu

Should now load products successfully!

## Architecture

```
User Browser
    ↓
https://scafffood.my.id (Vercel - Next.js Frontend)
    ↓
/api/* routes → app/api/[...path]/route.ts (Next.js API Proxy)
    ↓
https://api.scafffood.my.id (Cloudflare Tunnel)
    ↓
localhost:8080 (Docker - Go Backend)
    ↓
PostgreSQL Database
```

## Troubleshooting

### If API returns 404 in production:
1. Check Vercel environment variable is set: `BACKEND_API_URL=https://api.scafffood.my.id`
2. Check backend is running: `docker-compose ps`
3. Check tunnel is accessible: `curl https://api.scafffood.my.id/api/health`

### If tunnel is not working:
```bash
# Check cloudflared logs
docker-compose logs cloudflared

# Restart tunnel
docker-compose restart cloudflared
```

### If backend is not running:
```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs api
```
