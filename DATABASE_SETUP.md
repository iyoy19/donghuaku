# Database Setup Guide

This guide will help you set up PostgreSQL database with Docker and connect it to your project.

## Prerequisites

- Docker and Docker Compose installed on your system
- Node.js and npm installed

## Step 1: Start PostgreSQL with Docker

Start the PostgreSQL container:

```bash
npm run db:up
```

Or manually:

```bash
docker-compose up -d
```

This will:
- Create a PostgreSQL 16 container
- Set up database with credentials:
  - **Database**: `donghuaku_db`
  - **User**: `donghuaku_user`
  - **Password**: `donghuaku_password`
  - **Port**: `5432`

## Step 2: Install Dependencies

Install all required dependencies including backend packages:

```bash
npm install
```

## Step 3: Create Environment File

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL=postgresql://donghuaku_user:donghuaku_password@localhost:5432/donghuaku_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=donghuaku_user
DB_PASSWORD=donghuaku_password
DB_NAME=donghuaku_db

# Backend API
API_PORT=3001
API_URL=http://localhost:3001

# Frontend (Vite)
VITE_API_URL=http://localhost:3001
VITE_TMDB_API_KEY=your_api_key_here
```

## Step 4: Initialize Database Schema

Run the initialization script to create tables:

```bash
npm run db:init
```

This will create:
- `donghua` table - for storing donghua information
- `episodes` table - for storing episode data
- `admin_users` table - for admin authentication
- Indexes and triggers for better performance

## Step 5: Start the Backend Server

Start the Express server:

```bash
npm run dev:server
```

The server will run on `http://localhost:3001`

## Step 6: Test the Connection

Visit these endpoints to verify everything is working:

- Health check: `http://localhost:3001/health`
- Database test: `http://localhost:3001/api/test-db`

## Running Frontend and Backend Together

To run both frontend and backend simultaneously:

```bash
npm run dev:all
```

## Useful Commands

```bash
# Start database
npm run db:up

# Stop database
npm run db:down

# Initialize database schema
npm run db:init

# Start backend server only
npm run dev:server

# Start frontend only
npm run dev

# Start both frontend and backend
npm run dev:all
```

## Database Connection Details

- **Host**: localhost
- **Port**: 5432
- **Database**: donghuaku_db
- **Username**: donghuaku_user
- **Password**: donghuaku_password

## Troubleshooting

### Database connection error

1. Make sure Docker is running
2. Check if container is up: `docker ps`
3. Check container logs: `docker logs donghuaku_db`

### Port already in use

If port 5432 is already in use, you can change it in `docker-compose.yml`:

```yaml
ports:
  - "5433:5432"  # Change 5433 to any available port
```

Then update your `.env` file with the new port.

### Reset database

To reset the database completely:

```bash
npm run db:down
docker volume rm donghuaku_postgres_data
npm run db:up
npm run db:init
```

