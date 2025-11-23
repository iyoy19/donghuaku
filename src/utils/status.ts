/**
 * Map TMDB numeric status IDs to IMDB status strings for Movies and TV Shows
 * @param mediaType "movie" or "tv"
 * @param tmdbStatusId number status from TMDB
 * @returns string mapped status to store in DB
 */
export function mapTmdbStatusIdToStatus(
  mediaType: "movie" | "tv",
  tmdbStatusId: number | null | undefined
): string {
  if (mediaType === "tv") {
    switch (tmdbStatusId) {
      case 0:
        return "returning";
      case 1:
        return "planned";
      case 2:
        return "in_production";
      case 3:
        return "ended";
      case 4:
        return "canceled";
      case 5:
        return "pilot";
      default:
        return "unknown";
    }
  } else if (mediaType === "movie") {
    switch (tmdbStatusId) {
      case 0:
        return "rumored";
      case 1:
        return "planned";
      case 2:
        return "in_production";
      case 3:
        return "post_production";
      case 4:
        return "released";
      case 5:
        return "canceled";
      default:
        return "unknown";
    }
  }
  return "unknown";
}

/**
 * Map TMDB string status to numeric TMDB status ID for movie or tv
 * @param statusStr string TMDB status string
 * @param mediaType "movie" or "tv"
 * @returns TMDB numeric status ID or null if unknown
 */
export function mapTmdbStatusStringToId(statusStr: string | null | undefined, mediaType: "movie" | "tv"): number | null {
  if (!statusStr) return null;
  const s = statusStr.toLowerCase();
  if (mediaType === "tv") {
    switch (s) {
      case "returning series":
        return 0;
      case "planned":
        return 1;
      case "in production":
        return 2;
      case "ended":
        return 3;
      case "canceled":
      case "cancelled":
        return 4;
      case "pilot":
        return 5;
      default:
        return null;
    }
  } else if (mediaType === "movie") {
    switch (s) {
      case "rumored":
        return 0;
      case "planned":
        return 1;
      case "in production":
        return 2;
      case "post production":
        return 3;
      case "released":
        return 4;
      case "canceled":
      case "cancelled":
        return 5;
      default:
        return null;
    }
  }
  return null;
}
