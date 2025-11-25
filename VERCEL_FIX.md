# Vercel API Error Fix

## Problem

The application was receiving this error on Vercel:

```
🔴 [API DEBUG] JSON parse error: {url: '/api/api/donghua?type=latest', error: `Unexpected token '<', "<!doctype "... is not valid JSON`}
```

## Root Causes

1. **Double `/api/` prefix**: The API client was using `/api` as the base URL in production, then appending endpoints like `/api/donghua`, resulting in `/api/api/donghua`
2. **Incorrect Vercel rewrites**: The `vercel.json` was catching all requests and redirecting them to `index.html`, including API requests, which returned HTML instead of JSON

## Solutions Applied

### 1. Fixed `vercel.json` rewrites (Priority: Highest)

Added a specific rewrite rule for `/api/` routes to be preserved before the SPA fallback:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures API routes are NOT caught by the SPA fallback.

### 2. Fixed API client base URL in `src/services/api.ts`

Changed the production base URL from `/api` to an empty string:

```typescript
const getApiUrl = (): string => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }
  return ""; // ✅ Changed from "/api" to ""
};
```

### 3. Removed duplicate `/api/` prefixes from all endpoint paths

Updated all API method calls to use paths without the `/api/` prefix since the endpoints themselves are already at `/api/*`:

**Before:**

```typescript
async getLatestDonghua() {
  return this.get<{ results: any[] }>("/api/donghua?type=latest");
}
```

**After:**

```typescript
async getLatestDonghua() {
  return this.get<{ results: any[] }>("/donghua?type=latest");
}
```

All endpoints were updated:

- `/api/donghua` → `/donghua`
- `/api/episodes` → `/episodes`
- `/api/search` → `/search`
- `/api/tmdb` → `/tmdb`
- `/api/admin` → `/admin`
- etc.

## How it Works Now

### Development (localhost)

- Base URL: `http://localhost:3001`
- Full endpoint: `http://localhost:3001/donghua?type=latest` ✅

### Production (Vercel)

- Base URL: `""` (empty)
- Full endpoint: `/donghua?type=latest`
- Vercel router matches `/api/donghua` rewrite and forwards to serverless function ✅
- No double `/api/api/` prefix ✅

## Testing

After deployment, verify:

1. Network requests show `/donghua?type=latest` (not `/api/api/donghua`)
2. API responses are valid JSON (not HTML)
3. All sections load data correctly: Latest, Trending, Top Rated, Genres

## Additional Notes

- The health check endpoint is still at `/health` (no `/api/` prefix needed)
- Ensure `VITE_API_URL` environment variable is not set in production (or is set correctly)
- All API Vercel serverless functions remain in the `/api/` directory as required
