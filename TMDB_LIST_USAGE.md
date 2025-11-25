# TMDB List Item Status API Usage

## Endpoint yang Ditambahkan

Endpoint `/list/{list_id}/item_status` dari TMDB API telah diintegrasikan ke dalam aplikasi untuk mengecek apakah item (movie atau TV) sudah ada di list TMDB tertentu.

## Method yang Tersedia

### 1. `checkListItemStatus(listId, movieId?, tvId?)`

Mengecek apakah item sudah ada di list TMDB.

**Parameter:**
- `listId` (string | number): ID dari list TMDB
- `movieId` (number, optional): ID movie jika mengecek movie
- `tvId` (number, optional): ID TV series jika mengecek TV

**Return:**
```typescript
{
  id: string;
  item_present: boolean;
}
```

**Contoh Penggunaan:**

```typescript
import { tmdb } from '@/services/tmdb';

// Cek apakah TV series dengan ID 12345 ada di list dengan ID "8500209"
const status = await tmdb.checkListItemStatus("8500209", undefined, 12345);
if (status.item_present) {
  console.log("Item sudah ada di list");
}

// Cek apakah movie dengan ID 67890 ada di list
const movieStatus = await tmdb.checkListItemStatus("8500209", 67890);
if (movieStatus.item_present) {
  console.log("Movie sudah ada di list");
}
```

### 2. `getListDetails(listId)`

Mendapatkan detail dari list TMDB.

### 3. `getListItems(listId)`

Mendapatkan semua item dalam list TMDB.

## Cara Menggunakan untuk Validasi Import

Endpoint ini bisa digunakan untuk validasi tambahan sebelum import donghua:

```typescript
// Contoh: Validasi sebelum import
const listId = "8500209"; // ID list TMDB Anda
const tmdbId = 12345;
const mediaType = "tv";

try {
  const status = await tmdb.checkListItemStatus(
    listId,
    mediaType === "movie" ? tmdbId : undefined,
    mediaType === "tv" ? tmdbId : undefined
  );
  
  if (status.item_present) {
    console.log("Item sudah ada di list TMDB, skip import");
    return;
  }
  
  // Lanjutkan import jika belum ada
  await api.syncFromTMDB({ tmdbId, type: mediaType });
} catch (error) {
  console.error("Error checking list status:", error);
}
```

## Catatan

- Endpoint ini memerlukan API key TMDB yang valid
- List ID harus berupa list yang sudah dibuat di akun TMDB Anda
- Endpoint ini berguna untuk menghindari duplikasi dengan mengecek list TMDB yang sudah dibuat sebelumnya


