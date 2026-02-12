# Fix for 405 Method Not Allowed Error

## Problem
The frontend was getting a 405 error when trying to call `/api/auth/send-code`:
```
POST https://scafffood.my.id/api/auth/send-code 405 (Method Not Allowed)
```

## Root Cause
The frontend (Next.js) is deployed on Vercel at `https://scafffood.my.id`, but the backend (Go API) is not accessible at the same domain. When the browser tries to call `/api/auth/send-code`, there's no server handling that request.

## Solution
Created Next.js API routes that act as a proxy between the frontend and the Go backend:

### Files Created:
1. `app/api/auth/send-code/route.ts` - Proxies send-code requests
2. `app/api/auth/verify-code/route.ts` - Proxies verify-code requests

### Files Modified:
1. `app/login/page.tsx` - Updated to call local API routes instead of external URL
2. `.env.production` - Added `BACKEND_API_URL` variable

## How It Works Now

**Before (Broken):**
```
Browser → https://scafffood.my.id/api/auth/send-code → ❌ No server
```

**After (Fixed):**
```
Browser → https://scafffood.my.id/api/auth/send-code 
        → Next.js API Route (proxy)
        → Go Backend at ${BACKEND_API_URL}/api/auth/send-code
        → ✅ Response
```

## Deployment Checklist

### For Vercel (Frontend):
1. Set environment variable in Vercel dashboard:
   ```
   BACKEND_API_URL=https://your-go-backend-url.com
   ```
   (Replace with your actual Go backend URL)

2. Redeploy the application

### For Backend (Go API):
1. Deploy your Go backend to:
   - Railway (recommended)
   - Render
   - Fly.io
   - Your own server

2. Make sure these endpoints are accessible:
   - `POST /api/auth/send-code`
   - `POST /api/auth/verify-code`

3. Update `BACKEND_API_URL` in Vercel with your backend URL

## Testing

### Local Testing:
```bash
# Terminal 1: Start Go backend
cd api
go run main.go

# Terminal 2: Start Next.js frontend
npm run dev
```

Visit `http://localhost:3000/login` and try logging in.

### Production Testing:
1. Deploy backend first
2. Update `BACKEND_API_URL` in Vercel
3. Redeploy frontend
4. Visit `https://scafffood.my.id/login` and test

## Environment Variables Summary

### .env.local (Development)
```env
NEXT_PUBLIC_API_URL=http://localhost:8080
BACKEND_API_URL=http://localhost:8080
```

### .env.production (Production)
```env
NEXT_PUBLIC_API_URL=https://scafffood.my.id
BACKEND_API_URL=https://your-backend-url.com
```

## Notes
- The `NEXT_PUBLIC_API_URL` is used by the browser for direct API calls (products, orders, etc.)
- The `BACKEND_API_URL` is used by Next.js API routes for server-side proxying (auth endpoints)
- Make sure your Go backend has CORS enabled for the frontend domain
