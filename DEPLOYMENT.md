# Deployment Guide

## Architecture

This application consists of two parts:
1. **Frontend**: Next.js app (deployed on Vercel)
2. **Backend**: Go API server (needs separate deployment)

## The 405 Error Fix

The 405 error occurs because the frontend tries to call `/api/auth/send-code` on the same domain, but there's no backend server handling those requests.

### Solution: Next.js API Route Proxy

We've created Next.js API routes that proxy authentication requests to the actual Go backend:
- `app/api/auth/send-code/route.ts`
- `app/api/auth/verify-code/route.ts`

## Environment Variables

### Frontend (.env.production)

```env
# Frontend API URL (used by browser)
NEXT_PUBLIC_API_URL=https://scafffood.my.id

# Backend API URL (used by Next.js API routes for server-side proxying)
BACKEND_API_URL=https://your-backend-url.com
```

### Backend (api/.env)

```env
DB_HOST=your-db-host
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your-password
DB_NAME=management_preorder
PORT=8080
```

## Deployment Steps

### 1. Deploy Backend (Go API)

Deploy your Go backend to one of these platforms:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Fly.io**: https://fly.io
- **Your own server with Cloudflare Tunnel**

After deployment, you'll get a URL like:
- `https://your-app.railway.app`
- `https://your-app.onrender.com`
- Or your custom domain

### 2. Update Environment Variables

In Vercel, set the environment variable:
```
BACKEND_API_URL=https://your-backend-url.com
```

### 3. Redeploy Frontend

After updating the environment variable, redeploy your Vercel app.

## How It Works

1. Browser calls: `https://scafffood.my.id/api/auth/send-code`
2. Next.js API route receives the request
3. Next.js proxies to: `${BACKEND_API_URL}/api/auth/send-code`
4. Go backend processes the request
5. Response is returned to the browser

## Testing Locally

```bash
# Terminal 1: Start backend
cd api
go run main.go

# Terminal 2: Start frontend
npm run dev
```

The frontend will call `http://localhost:3000/api/auth/send-code`, which proxies to `http://localhost:8080/api/auth/send-code`.
