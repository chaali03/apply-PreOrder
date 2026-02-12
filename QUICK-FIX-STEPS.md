# Quick Fix Steps - 405 Error

## The Problem
Your production site is still showing the 405 error because it's running the old code. The fix is in your local files but not deployed yet.

## Immediate Solution (3 Steps)

### Step 1: Commit and Push Changes
```bash
git add .
git commit -m "Fix: Add Next.js API proxy routes for authentication"
git push
```

### Step 2: Deploy Your Go Backend
Your Go backend (the `api/` folder) needs to be running somewhere. Choose one:

**Option A: Railway (Recommended - Free tier available)**
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will detect the Go app in `api/` folder
6. Add environment variables in Railway:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
7. Copy the deployment URL (e.g., `https://your-app.railway.app`)

**Option B: Render (Free tier available)**
1. Go to https://render.com
2. Sign up/login
3. New → Web Service
4. Connect your repository
5. Set Root Directory to `api`
6. Build Command: `go build -o main .`
7. Start Command: `./main`
8. Add environment variables
9. Copy the deployment URL

**Option C: Use Cloudflare Tunnel (If you have a server)**
```bash
# On your server where the Go backend runs
cloudflared tunnel --url http://localhost:8080
```

### Step 3: Update Vercel Environment Variable
1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `BACKEND_API_URL`
   - **Value**: Your backend URL from Step 2 (e.g., `https://your-app.railway.app`)
   - **Environment**: Production
5. Click **Save**
6. Go to **Deployments** tab
7. Click the three dots on the latest deployment → **Redeploy**

## Verify the Fix

After redeployment completes (2-3 minutes):

1. Visit https://scafffood.my.id/login
2. Open browser console (F12)
3. Try to login
4. You should see:
   ```
   POST https://scafffood.my.id/api/auth/send-code 200 OK
   ```
   Instead of 405 error

## What Changed?

### Files Added:
- `app/api/auth/send-code/route.ts` - Proxy for send-code
- `app/api/auth/verify-code/route.ts` - Proxy for verify-code

### Files Modified:
- `app/login/page.tsx` - Now calls `/api/auth/send-code` instead of `${NEXT_PUBLIC_API_URL}/api/auth/send-code`

### How It Works:
```
Before (❌ Broken):
Browser → https://scafffood.my.id/api/auth/send-code → No server → 405 Error

After (✅ Fixed):
Browser → https://scafffood.my.id/api/auth/send-code 
        → Next.js API Route (runs on Vercel)
        → ${BACKEND_API_URL}/api/auth/send-code (your Go backend)
        → Response → Browser
```

## Troubleshooting

### Still getting 405 after deployment?
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Check Vercel deployment logs for errors
- Verify `BACKEND_API_URL` is set correctly in Vercel

### Getting connection errors?
- Make sure your Go backend is running and accessible
- Test your backend URL directly: `curl https://your-backend-url/api/health`
- Check CORS settings in your Go backend (should allow your frontend domain)

### Backend not accessible?
- If using Railway/Render, check the service is running
- If using Cloudflare Tunnel, make sure the tunnel is active
- Check backend logs for errors

## Need Help?

Check these files for more details:
- `FIX-405-ERROR.md` - Detailed explanation
- `DEPLOYMENT.md` - Full deployment guide
- `api/main.go` - Backend code (line 708 has the auth endpoint)
