# DonghuaKu - Streaming Website

A fully functional streaming website for watching Donghua (Chinese animations) built with modern web technologies.

## 🚀 Features

- **Homepage** with hero banner, trending carousel, latest episodes, and genre sections
- **Detail Page** with metadata, episode list, and recommendations
- **Video Player** with multi-server embed support and automatic fallback
- **Search System** with filters (year, rating, genre, sorting)
- **Dark/Light Theme** switcher
- **Admin UI** (dummy) for managing donghua and episodes
- **Beautiful Anime-style UI** with Framer Motion animations

## 🛠 Tech Stack

- **Vite** - Build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Framer Motion** - Animations
- **React Router DOM** - Routing
- **Lucide Icons** - Icons
- **Prisma** - ORM untuk database
- **PostgreSQL** - Database
- **Express** - Backend API
- **TMDB API** - Content data

## 📦 Installation

1. Install dependencies:
```bash
npm install
```

2. Start PostgreSQL database:
```bash
npm run db:up
```

3. Create `.env` file:
```env
# Database
DATABASE_URL=postgresql://admin:admin@localhost:5432/donghuaku?schema=public

# API Port (optional, defaults to 3001)
API_PORT=3001

# TMDB API Key (for both frontend and backend)
VITE_TMDB_API_KEY=your_api_key_here
TMDB_API_KEY=your_api_key_here
```

**Note:** 
- `VITE_TMDB_API_KEY` digunakan oleh frontend (client-side)
- `TMDB_API_KEY` digunakan oleh backend server untuk sync data dari TMDB
- Keduanya bisa menggunakan API key yang sama

4. Setup Prisma:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed database (optional)
npm run db:seed
```

5. Start development servers:
```bash
# Start both frontend and backend
npm run dev:all

# Or separately:
npm run dev        # Frontend only
npm run dev:server # Backend only
```

Lihat [PRISMA_SETUP.md](./PRISMA_SETUP.md) untuk panduan lengkap setup Prisma.

## 🎨 Project Structure

```
src/
  components/       # Reusable components
  pages/           # Page components
  data/            # Dummy data files
  hooks/           # Custom hooks
  utils/           # Utility functions
  types/           # TypeScript types
  services/        # API services
  styles/          # Global styles
```

## 🎯 Routes

- `/` - Homepage
- `/detail/:id` - Donghua detail page
- `/watch/:id/:episode` - Video player page
- `/search` - Search results page
- `/admin` - Admin dashboard (protected)
- `/admin/login` - Admin login page
- `/admin/manage` - Manage donghua
- `/admin/add-donghua` - Add new donghua
- `/admin/add-episode` - Add new episode

## 📝 Notes

- Backend API menggunakan Prisma ORM dengan PostgreSQL
- Database dapat diakses melalui Prisma Studio: `npm run db:studio`
- Video player supports multiple embed servers with automatic fallback
- Theme preference is saved in localStorage
- Lihat [PRISMA_SETUP.md](./PRISMA_SETUP.md) untuk setup database lengkap

## 🔧 Development

- Build for production: `npm run build`
- Preview production build: `npm run preview`

## 📄 License

MIT

