# Testing TMDB Status Import

## Overview

Data dari TMDB (movie atau series donghua) sekarang akan diimpor dengan status yang sesuai:

- **ongoing**: Untuk TV series yang masih berlanjut (status TMDB: "Returning Series")
- **completed**: Untuk TV series yang sudah berakhir (status TMDB: "Ended", "Canceled") atau movies yang sudah dirilis
- **upcoming**: Untuk TV series/movies yang belum dirilis atau dalam produksi

## Helper Function

Fungsi `determineStatusFromTMDB()` menentukan status berdasarkan:

### Untuk TV Series:

- "Returning Series" → **ongoing**
- "Ended", "Canceled", "Pilot" → **completed**
- "In Production", "Planned" → **upcoming**
- Fallback: Jika air_date sudah lewat → **ongoing**, jika belum → **upcoming**

### Untuk Movies:

- Jika release_date sudah lewat → **completed**
- Jika release_date masih depan → **upcoming**
- Status TMDB "Released" → **completed**

## Endpoints

### 1. POST `/api/admin/import/tmdb`

**Import massal dari TMDB (popular, trending, top_rated)**

```bash
curl -X POST http://localhost:3001/api/admin/import/tmdb \
  -H "Content-Type: application/json" \
  -d '{
    "type": "popular",
    "limit": 10
  }'
```

**Response:**

```json
{
  "success": true,
  "message": "Import complete: 8 imported, 2 updated, 0 errors",
  "imported": 8,
  "updated": 2,
  "errors": 0
}
```

**Log Output:**

```
✅ Imported: Soul Land (status: ongoing, mediaType: tv)
✅ Updated: Link Click (status: ongoing, mediaType: tv)
✅ Imported: The Legend of Vox Machina (status: completed, mediaType: tv)
```

### 2. POST `/api/tmdb/sync`

**Sync satu donghua dari TMDB ke database**

```bash
curl -X POST http://localhost:3001/api/tmdb/sync \
  -H "Content-Type: application/json" \
  -d '{
    "tmdbId": 113988,
    "type": "tv"
  }'
```

**Response:**

```json
{
  "id": 1,
  "tmdbId": 113988,
  "title": "Soul Land",
  "status": "ongoing",
  "mediaType": "tv",
  "episodeCount": 52,
  ...
}
```

**Log Output:**

```
✅ Created donghua: Soul Land (TMDB ID: 113988, Type: tv, Status: ongoing)
✅ Episodes synced for Soul Land: 52 episodes (status: ongoing)
```

### 3. GET `/api/donghua`

**Fetch semua donghua (sudah tersimpan dengan status yang benar)**

```bash
curl http://localhost:3001/api/donghua
```

## Status Test Cases

### Test Case 1: TV Series - Ongoing

**Expected:** TMDB status "Returning Series" → saved as "ongoing"

```json
{
  "title": "Soul Land",
  "status": "Returning Series", // TMDB status
  "media_type": "tv"
}
// Result in DB: status = "ongoing" ✓
```

### Test Case 2: TV Series - Completed

**Expected:** TMDB status "Ended" → saved as "completed"

```json
{
  "title": "Attack on Titan",
  "status": "Ended", // TMDB status
  "media_type": "tv"
}
// Result in DB: status = "completed" ✓
```

### Test Case 3: Movie - Completed

**Expected:** Release date sudah lewat → saved as "completed"

```json
{
  "title": "Your Name",
  "release_date": "2016-08-26", // Past date
  "media_type": "movie"
}
// Result in DB: status = "completed" ✓
```

### Test Case 4: Movie - Upcoming

**Expected:** Release date masih depan → saved as "upcoming"

```json
{
  "title": "Unknown Movie",
  "release_date": "2025-12-31", // Future date
  "media_type": "movie"
}
// Result in DB: status = "upcoming" ✓
```

### Test Case 5: TV Series - No Episodes Yet

**Expected:** Ketika sync tapi belum ada episodes → automatic "upcoming"

```json
{
  "title": "New Series",
  "status": "In Production", // TMDB status
  "media_type": "tv",
  "number_of_episodes": 0
}
// Result in DB: status = "upcoming" ✓
```

## Verification Query

Setelah import, verifikasi data di database:

```sql
-- Check status distribution
SELECT status, COUNT(*) as count FROM donghua GROUP BY status;

-- Check specific donghua status
SELECT id, title, status, media_type, episode_count FROM donghua WHERE title LIKE '%Soul%';

-- Check all TV series with status
SELECT id, title, status, media_type, episode_count FROM donghua WHERE media_type = 'tv' ORDER BY status;

-- Check all movies with status
SELECT id, title, status, media_type FROM donghua WHERE media_type = 'movie' ORDER BY status;
```

## Features Implemented

✅ Auto-determine status dari TMDB data (tidak perlu manual input)
✅ Support untuk movie dan TV series
✅ Konsisten handling untuk ongoing/completed/upcoming
✅ Logging untuk tracking setiap import/update
✅ Refine status setelah episodes di-sync
✅ Preserve Kids content filtering

## Notes

- Status di-determine saat import, tidak dapat diubah secara otomatis di kemudian hari
- Untuk mengubah status, gunakan endpoint PUT `/api/admin/donghua/:id`
- Kids content tetap di-filter dan tidak akan masuk ke database (except di endpoint khusus kids)
- Movies selalu dihitung sebagai "completed" setelah release_date
- TV series status bergantung pada TMDB status field
