# Quick Start Guide

## 🚀 Get Started (Using Neon + Vercel)

### 1. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your Neon credentials:

```env
# From Neon Dashboard
DATABASE_URL=postgresql://neondb_owner:password@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# From TMDB
VITE_TMDB_API_KEY=your-tmdb-api-key

# Local development
VITE_API_URL=http://localhost:3001
API_PORT=3001
```

### 2. Setup Database Schema

```bash
npm install

# Generate Prisma client
npm run db:generate

# Push schema to Neon
npm run db:push

# (Optional) Seed data
npm run db:seed
```

### 3. Start Development Servers

**Option A: Both servers at once**

```bash
npm run dev:all
```

**Option B: Separate terminals**

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev
```

Access at: `http://localhost:5175`

## 🌐 Deployment to Vercel

For complete Vercel + Neon setup, see [NEON_VERCEL_SETUP.md](./NEON_VERCEL_SETUP.md)

Quick checklist:

- [ ] Push to GitHub
- [ ] Connect to Vercel
- [ ] Add `DATABASE_URL` env var (NO @secret references!)
- [ ] Add `VITE_TMDB_API_KEY` env var
- [ ] Deploy

Test deployment: `https://yourapp.vercel.app/debug/db` should show `✅ DB CONNECTED`

## Or run both together:

```bash
npm run dev:all
```

## ✅ Verify Setup

1. Check database: Visit `http://localhost:3001/health`
2. Test connection: Visit `http://localhost:3001/api/test-db`
3. Frontend: Visit `http://localhost:5173` (or the port Vite shows)

## 📚 Full Documentation

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.
