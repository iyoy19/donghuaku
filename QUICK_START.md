# Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Start PostgreSQL Database

```bash
npm run db:up
```

This starts PostgreSQL in Docker with:
- Database: `donghuaku_db`
- User: `donghuaku_user`
- Password: `donghuaku_password`
- Port: `5432`

### 2. Create `.env` File

Create a `.env` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=donghuaku_user
DB_PASSWORD=donghuaku_password
DB_NAME=donghuaku_db

API_PORT=3001
VITE_API_URL=http://localhost:3001
```

### 3. Initialize Database & Start Servers

```bash
# Install dependencies (if not done)
npm install

# Initialize database schema
npm run db:init

# Start backend server
npm run dev:server

# In another terminal, start frontend
npm run dev
```

Or run both together:

```bash
npm run dev:all
```

## ✅ Verify Setup

1. Check database: Visit `http://localhost:3001/health`
2. Test connection: Visit `http://localhost:3001/api/test-db`
3. Frontend: Visit `http://localhost:5173` (or the port Vite shows)

## 📚 Full Documentation

See [DATABASE_SETUP.md](./DATABASE_SETUP.md) for detailed instructions.

