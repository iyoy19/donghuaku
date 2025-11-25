# Setup Neon + Vercel

Panduan lengkap untuk menggunakan Neon sebagai database dan Vercel untuk deployment.

## 📋 Prerequisites

- Node.js v16+
- PostgreSQL database di [Neon](https://neon.tech)
- Vercel account untuk deployment
- TMDB API key

## 🚀 Development Setup

### 1. Konfigurasi Environment Variables

Salin `.env.example` ke `.env`:

```bash
cp .env.example .env
```

Update `DATABASE_URL` dengan connection string dari Neon:

```env
DATABASE_URL=postgresql://neondb_owner:password@ep-host.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
VITE_TMDB_API_KEY=your-tmdb-api-key
VITE_API_URL=http://localhost:3001
API_PORT=3001
```

### 2. Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema ke Neon
npm run db:push

# (Optional) Seed database
npm run db:seed
```

### 3. Menjalankan Development

**Option A: Run Both Servers Concurrently**

```bash
npm run dev:all
```

**Option B: Run Separately (di 2 terminal)**

Terminal 1 - Backend Server:

```bash
npm run dev:server
```

Terminal 2 - Frontend Server:

```bash
npm run dev
```

Aplikasi akan berjalan di:

- Frontend: `http://localhost:5175` (atau port lain jika 5173-5174 sudah digunakan)
- Backend: `http://localhost:3001`

## 🌐 Vercel Deployment

### 1. SPA Routing Setup

Untuk aplikasi Single Page App (React Router), Vercel perlu mengarahkan semua request ke `index.html`. Ini sudah dikonfigurasi di `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Ini memastikan routes seperti `/admin`, `/detail/:id`, dll bekerja di Vercel.

### 2. Push Code ke GitHub

```bash
git add .
git commit -m "Setup Neon + Vercel with SPA routing"
git push origin main
```

### 3. Connect ke Vercel

1. Buka [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New" → "Project"
3. Import repository GitHub Anda
4. Framework preset: Vite (akan terdeteksi otomatis)

### 4. Environment Variables

Di Vercel Project Settings → Environment Variables, tambahkan:

```
DATABASE_URL = postgresql://...
VITE_TMDB_API_KEY = your-api-key
```

### 5. Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 6. Deploy

Click "Deploy" dan tunggu build selesai.

Aplikasi akan live di domain Vercel (misalnya `https://yourproject.vercel.app`)

- Routes akan langsung accessible: `/admin`, `/detail/:id`, `/search`, dll
- Database akan connect ke Neon production

## ✅ Testing

### Check Backend Connection

```bash
curl http://localhost:3001/health
```

Response:

```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2024-11-25T..."
}
```

### Check Database Connection

```bash
curl http://localhost:3001/api/test-db
```

## 📝 Notes

- **Development**: Backend server Express berjalan di port 3001, menghubung ke Neon
- **Production (Vercel)**: Frontend di-deploy ke Vercel, menggunakan Neon database
- **SPA Routing**: `vercel.json` mengkonfigurasi rewrites untuk semua routes → `index.html`
- **API Routes**: Vercel serverless functions di folder `/api` (sedang dalam development)
- Prisma ORM menangani semua database operations dengan Neon connection pooling

## 🔗 Useful Resources

- [Neon Documentation](https://neon.tech/docs)
- [Vercel Deployment](https://vercel.com/docs)
- [Prisma with Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [React Router SPA](https://reactrouter.com/docs/en/v6)

## 🐛 Troubleshooting

### `/admin` route not accessible di Vercel

**Problem**: Mendapat 404 saat akses `https://yourapp.vercel.app/admin`

**Solution**:

- ✅ Sudah fixed dengan `vercel.json` rewrites
- Pastikan file sudah di-push ke GitHub
- Redeploy di Vercel (bisa manual atau tunggu push baru)

### ERR_CONNECTION_REFUSED

**Problem**: Backend server tidak berjalan

**Solution**: Jalankan `npm run dev:server` di terminal terpisah

### Database Connection Error

**Problem**: Tidak bisa connect ke Neon

**Solution**:

1. Check `DATABASE_URL` di `.env`
2. Pastikan Neon project active
3. Verify firewall settings

### Port Already in Use

**Problem**: Port 3001 atau 5173 sudah digunakan

**Solution**:

- Update `API_PORT` di `.env`
- Atau kill process yang menggunakan port: `lsof -i :3001` dan `kill <PID>`
