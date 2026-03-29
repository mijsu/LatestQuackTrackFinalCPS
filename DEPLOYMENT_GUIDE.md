# QuackTrack Deployment Guide

## Current Setup

You have:
- ✅ PostgreSQL database on Render: `dpg-d6rairnkijhs73birf9g-a.oregon-postgres.render.com`
- ✅ FastAPI backend on Render: `https://quacktrack.onrender.com`
- ❌ **Missing**: Next.js frontend deployment

## Problem

Your mobile app needs a **Next.js server** to:
- Handle authentication (NextAuth)
- Run API routes (/api/*)
- Connect to the database

The FastAPI backend at `quacktrack.onrender.com` is **NOT** your Next.js app.

---

## Solution: Deploy Next.js to Render

### Step 1: Create a new Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub/GitLab repository
4. Configure:

   | Setting | Value |
   |---------|-------|
   | Name | `quacktrack-frontend` |
   | Region | Oregon (same as your database) |
   | Branch | main (or your branch) |
   | Runtime | **Node.js** (NOT Python!) |
   | Build Command | `npm install && npx prisma generate && npm run build` |
   | Start Command | `npm run start` |
   | Instance Type | Free |

### Step 2: Add Environment Variables

Add these environment variables in Render:

```
DATABASE_URL=postgresql://ptc_user:Oy3u5jHc9CLHVRyJOPHBxrTWCic4mli7@dpg-d6rairnkijhs73birf9g-a.oregon-postgres.render.com/quacktrack_6u94?sslmode=require

NEXTAUTH_SECRET=quacktrack-secret-key-for-production-2024

NEXTAUTH_URL=https://quacktrack-frontend.onrender.com

RESEND_API_KEY=re_Cn7inLmZ_B95NWuwLe35ekeYkkEFtsNSC

EMAIL_FROM=onboarding@resend.dev

NODE_ENV=production
```

**Important**: Change `NEXTAUTH_URL` to match your actual Render URL!

### Step 3: Deploy

Click **"Create Web Service"** and wait for deployment.

Your Next.js app will be at: `https://quacktrack-frontend.onrender.com`

---

## After Deployment: Update Mobile App

Once your Next.js app is deployed, update the configuration:

### 1. Update `.env`
```env
NEXTAUTH_URL=https://quacktrack-frontend.onrender.com
NEXT_PUBLIC_API_URL=https://quacktrack-frontend.onrender.com
```

### 2. Update `capacitor.config.ts`
```typescript
server: {
  url: 'https://quacktrack-frontend.onrender.com',
  cleartext: true,
},
```

### 3. Build the APK
```bash
BUILD_TARGET=mobile next build
bunx cap sync android
cd android && ./gradlew assembleDebug
```

---

## Alternative: Deploy to Vercel (Easier for Next.js)

Vercel is made by the Next.js team and is the easiest deployment option:

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "Add New" → "Project"
4. Import your repository
5. Add environment variables (same as above)
6. Deploy!

Your app will be at: `https://your-project-name.vercel.app`
