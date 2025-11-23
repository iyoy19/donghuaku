const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

/**
 * Get image URL - handles both TMDB relative paths and full URLs
 * @param path - Image path (can be relative TMDB path or full URL)
 * @param size - Image size for TMDB (default: 'original' for highest resolution)
 * @returns Full image URL
 */
export function getImageUrl(path: string | undefined | null, size: string = 'original'): string {
  if (!path) return '/placeholder.jpg'
  
  // If path is already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // If path starts with '/', it's a TMDB relative path
  if (path.startsWith('/')) {
    return `${TMDB_IMAGE_BASE}/${size}${path}`
  }
  
  // Otherwise, assume it's a TMDB relative path without leading slash
  return `${TMDB_IMAGE_BASE}/${size}/${path}`
}

