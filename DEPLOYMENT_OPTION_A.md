# Deployment Guide (Option A): Frontend on Vercel + Backend Hosted Separately

This project is a full-stack app:

- `client/` → Vite React frontend
- `server/` → Node.js + Express + tRPC backend
- `server/db.ts` uses `drizzle-orm/mysql2`, so the database is MySQL-compatible (your TiDB Cloud URL is compatible with this driver).

With **Option A**, deploy the frontend on Vercel and deploy backend separately (Railway / Render / Fly.io / VPS).

---

## 1) Backend deployment (separate host)

Deploy the Node server from this same repository to your backend host.

### Required backend environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | MySQL/TiDB connection URL |
| `JWT_SECRET` | Secret for signing session cookies |
| `OAUTH_SERVER_URL` | OAuth platform server URL |
| `VITE_APP_ID` | App ID registered in your auth platform |
| `OWNER_OPEN_ID` | OpenID of the admin user |
| `CORS_ORIGIN` | **Comma-separated list of allowed frontend origins** (e.g. `https://your-app.vercel.app`). Required for the Vercel frontend to call the backend across origins. |
| `NODE_ENV` | Set to `production` |
| `PORT` | Usually managed by the host platform |

> Security: never commit real credentials to git. Set them in provider environment settings only.

### Build/start commands (backend host)

This repo already provides scripts:

- Build: `pnpm build`
- Start: `pnpm start`

After deployment, note backend public URL, for example:

`https://parking-backend.example.com`

---

## 2) Frontend deployment on Vercel

### Recommended Vercel project settings

- Framework preset: **Vite**
- Root Directory: repository root (with provided `vercel.json`)
- Install Command: `pnpm install`
- Build Command: `vite build` *(frontend only — the `vercel.json` already sets this)*
- Output Directory: `dist/public` *(the `vercel.json` already sets this)*

### Frontend environment variables on Vercel

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | `https://parking-backend.example.com` (your backend URL) |
| `VITE_OAUTH_PORTAL_URL` | OAuth platform portal URL |
| `VITE_APP_ID` | App ID registered in your auth platform |

`VITE_API_BASE_URL` is used in two places:
- `client/src/main.tsx` — builds the tRPC URL: `$VITE_API_BASE_URL/api/trpc`
- `client/src/const.ts` — builds the OAuth callback URL: `$VITE_API_BASE_URL/api/oauth/callback`

> **Important:** The OAuth callback handler lives on the backend, so `VITE_API_BASE_URL` must point to the backend host for the auth flow to work correctly.

---

## 3) Local environment example

Use `client/.env.example` as template and create your local `.env` as needed:

```bash
cp client/.env.example client/.env
```

Then fill in the values:

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_OAUTH_PORTAL_URL=https://your-oauth-platform.example.com
VITE_APP_ID=your-app-id
```

Leave `VITE_API_BASE_URL` empty (or set to `http://localhost:3000`) for local dev — the Express server serves the frontend on the same origin.

---

## 4) Verify deployment

### Frontend checks

- Open Vercel URL
- Ensure dashboard/pages load
- Verify API-driven screens fetch data successfully

### Backend checks

- Confirm backend logs show incoming requests on `/api/trpc`
- Confirm database reads/writes work (stations/bookings/alerts flows)

---

## 5) Why this setup

Your frontend currently uses tRPC over HTTP and your backend is Express-based.  
Running backend separately is the simplest, most reliable production model on Vercel for this repository shape.
