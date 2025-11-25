# Prisma Setup Guide

Panduan ini akan membantu Anda mengatur Prisma dengan PostgreSQL untuk proyek Donghuaku.

## Prerequisites

- Docker dan Docker Compose terinstall
- Node.js dan npm terinstall
- PostgreSQL database sudah berjalan (via Docker)

## Step 1: Setup Environment Variables

Buat file `.env` di root directory dengan menyalin dari `.env.example`:

```bash
cp .env.example .env
```

Atau buat manual dengan konfigurasi berikut:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/donghuaku?schema=public
DB_HOST=localhost
DB_PORT=5432
DB_USER=admin
DB_PASSWORD=admin
DB_NAME=donghuaku

API_PORT=3001
API_URL=http://localhost:3001
VITE_API_URL=http://localhost:3001
VITE_TMDB_API_KEY=your_api_key_here
```

## Step 2: Start PostgreSQL Database

Pastikan database PostgreSQL sudah berjalan:

```bash
npm run db:up
```

Atau:

```bash
docker-compose up -d
```

## Step 3: Generate Prisma Client

**PENTING:** Generate Prisma Client dari schema terlebih dahulu:

```bash
npm run db:generate
```

Ini akan membuat TypeScript types untuk semua model di schema.

## Step 4: Run Database Migrations

Buat dan jalankan migration pertama:

```bash
npm run db:migrate
```

Ini akan:
- Membuat migration file di `prisma/migrations/`
- Menerapkan schema ke database
- Otomatis generate Prisma Client (jika belum)

**Catatan:** Di Prisma 7, `DATABASE_URL` harus diset di environment variable (file `.env`). Prisma akan membaca dari environment variable untuk migrations dan Prisma Client akan menggunakan adapter dengan connection string.

## Step 5: Seed Database (Optional)

Jalankan seed untuk mengisi data awal:

```bash
npm run db:seed
```

Ini akan membuat:
- Genre data (Animation, Action & Adventure, Drama, Fantasy)
- Admin user (username: `admin`, password: `admin123`)
- Sample donghua dan episodes

## Step 6: Verify Setup

Buka Prisma Studio untuk melihat data:

```bash
npm run db:studio
```

Ini akan membuka browser di `http://localhost:5555` di mana Anda bisa melihat dan mengedit data.

## Database Schema

### Models

1. **Donghua** - Menyimpan informasi donghua
   - Fields: id, tmdbId, title, chineseTitle, overview, synopsis, posterPath, backdropPath, dll.
   - Relations: episodes, genres

2. **Episode** - Menyimpan data episode
   - Fields: id, donghuaId, episodeNumber, title, thumbnail, duration, servers (JSON), subtitles (JSON)
   - Relations: donghua

3. **Genre** - Menyimpan genre
   - Fields: id, name
   - Relations: donghuas

4. **AdminUser** - Menyimpan data admin
   - Fields: id, username, password (hashed), email

## Using Prisma Client

Import Prisma Client di file server Anda:

```typescript
import { prisma } from './lib/prisma';

// Contoh penggunaan
const donghuas = await prisma.donghua.findMany({
  include: {
    episodes: true,
    genres: true,
  },
});
```

## Useful Commands

```bash
# Generate Prisma Client
npm run db:generate

# Create and run migration
npm run db:migrate

# Push schema changes without migration (development only)
npm run db:push

# Seed database
npm run db:seed

# Open Prisma Studio
npm run db:studio

# Deploy migrations (production)
npm run db:migrate:deploy
```

## Troubleshooting

### Error: Can't reach database server

1. Pastikan Docker container berjalan: `docker ps`
2. Cek logs: `docker logs donghuaku_db`
3. Pastikan DATABASE_URL di `.env` benar

### Error: Prisma Client not generated

Jalankan:
```bash
npm run db:generate
```

### Reset Database

Untuk reset database sepenuhnya:

```bash
# Stop database
npm run db:down

# Hapus volume
docker volume rm donghuaku_postgres_data

# Start database
npm run db:up

# Run migrations
npm run db:migrate

# Seed data
npm run db:seed
```

## Production Deployment

Untuk production, gunakan:

```bash
npm run db:migrate:deploy
```

Ini akan menjalankan migration tanpa membuat migration file baru (untuk CI/CD).

---

## Menggunakan MongoDB Atlas dengan Prisma

Proyek ini secara default menggunakan PostgreSQL, tetapi Anda bisa menghubungkan ke MongoDB Atlas untuk pengembangan.

### Langkah konfigurasi:

1. Di file `.env` sudah disiapkan variabel berikut:

```env
DATABASE_URL_POSTGRES="postgresql://username:password@host:port/database?schema=public"
DATABASE_URL_MONGO="mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority"
DATABASE_URL=$DATABASE_URL_POSTGRES
```

2. Variabel `DATABASE_URL` yang dipakai Prisma berada di `.env`, Anda bisa menggantinya secara manual ke:

```env
DATABASE_URL=$DATABASE_URL_MONGO
```

untuk menggunakan MongoDB Atlas.

3. Jangan lupa untuk mengubah juga `provider` di `prisma/schema.prisma` menjadi:

```prisma
datasource db {
  provider = "mongodb" // atau "postgresql" sesuai database yang dipakai
  url      = env("DATABASE_URL")
}
```

4. Setelah mengganti provider dan `DATABASE_URL`, jalankan ulang prisma generate dan migrate jika diperlukan:

```bash
npm run db:generate
npm run db:migrate
```

atau untuk development gunakan push migration:

```bash
npm run db:push
```

### Catatan:

- Swapping antara PostgreSQL dan MongoDB tidak otomatis, Anda harus mengubah konfigurasi secara manual di atas.
- Prisma schema untuk MongoDB mungkin perlu penyesuaian model karena fitur MongoDB berbeda dengan SQL.
- Data yang sudah ada pada satu database tidak dapat langsung dipakai di database lain tanpa migrasi data.

---

Jika ada pertanyaan lebih lanjut, silakan tanyakan.
DATABASE_URL=$DATABASE_URL_MONGO
DATABASE_URL=$DATABASE_URL_POSTGRES

