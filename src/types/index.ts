export interface Donghua {
  id: number;
  title: string;
  chineseTitle?: string;
  overview: string;
  poster_path: string;
  backdrop_path: string;
  posters?: string[]; // Multiple posters
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  status?: string;
  episode_count?: number;
  media_type?: "movie" | "tv";
  released_episodes_count?: number; // Number of episodes that have been released
  keywords?: any[]; // Keywords from TMDB
}

export interface Genre {
  id: number;
  name: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  thumbnail?: string;
  duration?: number;
  servers: VideoServer[];
  subtitles?: Subtitle[];
  airDate?: string;
  // TMDB Episode Metadata
  tmdbEpisodeId?: number;
  overview?: string;
  stillPath?: string;
  crew?: any[];
  guestStars?: any[];
  voteAverage?: number;
  voteCount?: number;
  productionCode?: string;
  seasonNumber?: number;
}

export interface VideoServer {
  name: string;
  url: string;
}

export interface Subtitle {
  lang: string;
  url: string;
}

export interface SearchFilters {
  year?: number;
  rating?: number;
  genre?: number;
  status?: string;
  sortBy?: "popularity" | "latest" | "a-z";
}

export interface AdminDonghua extends Donghua {
  tmdbId: number;
  synopsis: string;
  status: "ongoing" | "complete" | "upcoming"; // status type updated to 'complete'
}

// TMDB Discover API Filter Types
export interface TMDBDiscoverParams {
  // Year & Date
  primary_release_year?: number;
  primary_release_date_gte?: string; // YYYY-MM-DD
  primary_release_date_lte?: string; // YYYY-MM-DD
  first_air_date_gte?: string; // YYYY-MM-DD (TV)
  first_air_date_lte?: string; // YYYY-MM-DD (TV)

  // Language & Country
  with_original_language?: string; // ISO 639-1 code (e.g., 'zh', 'en')
  with_origin_country?: string; // ISO 3166-1 code (e.g., 'CN', 'US')

  // Rating
  vote_average_gte?: number;
  vote_average_lte?: number;
  vote_count_gte?: number;

  // Popularity & Sorting
  sort_by?:
    | "popularity.desc"
    | "popularity.asc"
    | "vote_average.desc"
    | "vote_average.asc"
    | "release_date.desc"
    | "release_date.asc"
    | "first_air_date.desc"
    | "first_air_date.asc";

  // Actors & Directors
  with_people?: string; // Comma-separated person IDs

  // Studio & Production Company
  with_companies?: string; // Comma-separated company IDs

  // Duration
  with_runtime_gte?: number;
  with_runtime_lte?: number;

  // Region
  region?: string; // ISO 3166-1 code
  watch_region?: string; // ISO 3166-1 code

  // Watch Provider
  with_watch_providers?: string; // Comma-separated provider IDs

  // Adult
  include_adult?: boolean;

  // Genre
  with_genres?: string; // Comma-separated genre IDs
  without_genres?: string; // Comma-separated genre IDs to exclude

  // Keywords (for donghua)
  with_keywords?: string; // Comma-separated keyword IDs
  without_keywords?: string; // Comma-separated keywords to exclude

  // Pagination
  page?: number;
}

export interface TMDBDonghuaDiscoverParams extends Partial<TMDBDiscoverParams> {
  // Donghua-specific overrides
  keywords?: number[]; // Donghua keyword IDs: cultivation(203348), wuxia(203349), martial arts(202102), xianxia(210024), immortal(213189), fantasy chinese(234678)
  year?: number;
  minRating?: number;
  maxRating?: number;
  minVoteCount?: number;
}
