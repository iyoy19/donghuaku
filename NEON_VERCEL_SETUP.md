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

### 4. Environment Variables (PENTING! ⚠️)

Di **Vercel Project Settings → Environment Variables**, tambahkan:

| Key                 | Value                                       |
| ------------------- | ------------------------------------------- |
| `DATABASE_URL`      | `postgresql://neondb_owner:...` (dari Neon) |
| `VITE_TMDB_API_KEY` | Your TMDB API key                           |

⚠️ **JANGAN gunakan secret references (@database_url)**. Paste langsung nilai aslinya!

### 5. Verify vercel.json

Pastikan `vercel.json` **TIDAK memiliki env section** dengan secret references:

❌ **SALAH (hapus ini)**:

```json
{
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

✅ **BENAR (seperti ini)**:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### 6. Build Settings

- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 7. Deploy

Click "Deploy" dan tunggu build selesai.

Aplikasi akan live di domain Vercel (misalnya `https://yourproject.vercel.app`)

- Routes akan langsung accessible: `/admin`, `/detail/:id`, `/search`, dll
- Database akan connect ke Neon production

## ✅ Testing

### Testing di Development (Localhost)

```bash
# Check health
curl http://localhost:3001/health

# Check database connection
curl http://localhost:3001/api/test-db
```

### Testing di Vercel (Production)

Setelah deploy, test dengan mengakses endpoint debug:

```
https://yourproject.vercel.app/debug/db
```

**Expected Response:**

```
✅ DB CONNECTED - Prisma + Neon working!
```

Jika mendapat error, berarti:

1. Environment variable `DATABASE_URL` belum di-set di Vercel
2. DATABASE_URL masih punya secret reference (@database_url)
3. Neon project sedang down atau connection pooler penuh

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

### "Error Memuat Data" - Invalid JSON Response

**Problem**: 
```
Unexpected token '<', "<!doctype "... is not valid JSON
```

Atau error memuat data di halaman

**Penyebab**:
- Backend Express server tidak berjalan
- Frontend mencoba fetch dari `http://localhost:3001` tapi server sudah shutdown
- Di Vercel: environment variable DATABASE_URL belum di-set dengan benar

**Solution**:

**Untuk Development (localhost):**
1. Pastikan backend server berjalan:
   ```bash
   npm run dev:server
   ```
2. Check apakah port 3001 accessible:
   ```bash
   curl http://localhost:3001/health
   ```
3. Lihat console browser (F12) untuk error details
4. Di VS Code terminal, check apakah ada error di backend

**Untuk Production (Vercel):**
1. Buka Vercel Project → Settings → Environment Variables
2. Pastikan `DATABASE_URL` sudah di-set dengan nilai yang benar
3. Pastikan tidak ada secret reference (`@database_url`) - harus nilai asli
4. Test endpoint: `https://yourproject.vercel.app/debug/db`
5. Check deployment logs di Vercel → Deployments → Logs

### Database Connection Error

**Problem**: Tidak bisa connect ke Neon

**Solution**:

1. Check `DATABASE_URL` di `.env`
2. Pastikan Neon project active
3. Verify firewall settings
4. Test dengan: `curl http://localhost:3001/api/test-db`

### Port Already in Use

**Problem**: Port 3001 atau 5173 sudah digunakan

**Solution**:

- Update `API_PORT` di `.env`
- Atau kill process yang menggunakan port

