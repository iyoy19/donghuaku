// TMDB API Wrapper

import type { TMDBDiscoverParams, TMDBDonghuaDiscoverParams } from "@/types";

const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY || "your-api-key-here";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

// Donghua Keywords
export const DONGHUA_KEYWORDS = {
  cultivation: 203348,
  wuxia: 203349,
  martialArts: 202102,
  xianxia: 210024,
  immortal: 213189,
  fantasyChinese: 234678,
} as const;

export const tmdb = {
  baseImageUrl: TMDB_IMAGE_BASE,

  getImageUrl(path: string, size: string = "w500") {
    if (!path) return "/placeholder.jpg";

    return `${TMDB_IMAGE_BASE}/${size}${path}`;
  },

  getHighResImage(path: string) {
    if (!path) return "/placeholder.jpg";

    return `${TMDB_IMAGE_BASE}/original${path}`;
  },

  async fetch(url: string) {
    const fullUrl = `${TMDB_BASE_URL}${url}${
      url.includes("?") ? "&" : "?"
    }api_key=${TMDB_API_KEY}`;

    try {
      const response = await fetch(fullUrl);

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `TMDB API Error: ${response.status} ${response.statusText}`;
        try {
          const errorData = await response.json();
          console.error("🔴 [TMDB DEBUG] Error response:", errorData);
          if (errorData.status_message) {
            errorMessage = `TMDB API Error: ${
              errorData.status_message
            } (Status: ${errorData.status_code || response.status})`;
          }
        } catch (e) {
          console.error("🔴 [TMDB DEBUG] Failed to parse error response:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("🔴 [TMDB DEBUG] Fetch error:", error);
      // Re-throw with more context if it's not already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`TMDB API Error: ${String(error)}`);
    }
  },

  // ------------------- Movie -------------------

  async getMovieDetail(movieId: number) {
    return this.fetch(`/movie/${movieId}`);
  },

  async getMovieAccountStates(movieId: number) {
    return this.fetch(`/movie/${movieId}/account_states`);
  },

  async getMovieAlternativeTitles(movieId: number) {
    return this.fetch(`/movie/${movieId}/alternative_titles`);
  },

  async getMovieChanges(movieId: number) {
    return this.fetch(`/movie/${movieId}/changes`);
  },

  async getMovieCredits(movieId: number) {
    return this.fetch(`/movie/${movieId}/credits`);
  },

  async getMovieExternalIds(movieId: number) {
    return this.fetch(`/movie/${movieId}/external_ids`);
  },

  async getMovieImages(movieId: number) {
    return this.fetch(`/movie/${movieId}/images`);
  },

  async getMovieKeywords(movieId: number) {
    return this.fetch(`/movie/${movieId}/keywords`);
  },

  async getMovieLatest() {
    return this.fetch(`/movie/latest`);
  },

  async getMovieLists(movieId: number) {
    return this.fetch(`/movie/${movieId}/lists`);
  },

  async getMovieRecommendations(movieId: number) {
    return this.fetch(`/movie/${movieId}/recommendations`);
  },

  async getMovieReleaseDates(movieId: number) {
    return this.fetch(`/movie/${movieId}/release_dates`);
  },

  async getMovieReviews(movieId: number) {
    return this.fetch(`/movie/${movieId}/reviews`);
  },

  async getMovieSimilar(movieId: number) {
    return this.fetch(`/movie/${movieId}/similar`);
  },

  async getMovieTranslations(movieId: number) {
    return this.fetch(`/movie/${movieId}/translations`);
  },

  async getMovieVideos(movieId: number) {
    return this.fetch(`/movie/${movieId}/videos`);
  },

  async getMovieWatchProviders(movieId: number) {
    return this.fetch(`/movie/${movieId}/watch/providers`);
  },

  // ------------------- TV -------------------

  async getTVDetail(tvId: number) {
    return this.fetch(`/tv/${tvId}`);
  },

  async getTVAccountStates(tvId: number) {
    return this.fetch(`/tv/${tvId}/account_states`);
  },

  async getTVAggregateCredits(tvId: number) {
    return this.fetch(`/tv/${tvId}/aggregate_credits`);
  },

  async getTVChanges(tvId: number) {
    return this.fetch(`/tv/${tvId}/changes`);
  },

  async getTVCredits(tvId: number) {
    return this.fetch(`/tv/${tvId}/credits`);
  },

  async getTVExternalIds(tvId: number) {
    return this.fetch(`/tv/${tvId}/external_ids`);
  },

  async getTVImages(tvId: number) {
    return this.fetch(`/tv/${tvId}/images`);
  },

  async getTVTranslations(tvId: number) {
    return this.fetch(`/tv/${tvId}/translations`);
  },

  async getTVVideos(tvId: number) {
    return this.fetch(`/tv/${tvId}/videos`);
  },

  async getTVWatchProviders(tvId: number) {
    return this.fetch(`/tv/${tvId}/watch/providers`);
  },

  // ------------------- Seasons & Episodes -------------------

  async getSeason(tvId: number, seasonNumber: number) {
    return this.fetch(`/tv/${tvId}/season/${seasonNumber}`);
  },

  // TV Episodes full endpoints

  async getEpisodeDetail(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`
    );
  },

  async getEpisodeAccountStates(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/account_states`
    );
  },

  async getEpisodeChanges(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/changes`
    );
  },

  async getEpisodeCredits(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/credits`
    );
  },

  async getEpisodeExternalIds(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/external_ids`
    );
  },

  async getEpisodeImages(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/images`
    );
  },

  async getEpisodeTranslations(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/translations`
    );
  },

  async getEpisodeVideos(
    tvId: number,
    seasonNumber: number,
    episodeNumber: number
  ) {
    return this.fetch(
      `/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}/videos`
    );
  },

  async getEpisodeFull(tvId: number, season: number, episode: number) {
    const details = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}`
    );

    const credits = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/credits`
    );

    const externalIds = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/external_ids`
    );

    const images = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/images`
    );

    const translations = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/translations`
    );

    const videos = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/videos`
    );

    const accountStates = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/account_states`
    );

    const keywords = await this.fetch(
      `/tv/${tvId}/season/${season}/episode/${episode}/keywords`
    );

    return {
      details,

      credits,

      externalIds,

      images,

      translations,

      videos,

      accountStates,

      keywords,
    };
  },

  // ------------------- Discover / Search / Trending -------------------

  async getPopular(type: "movie" | "tv" = "tv") {
    return this.fetch(`/${type}/popular`);
  },

  async getTrending(
    type: "all" | "movie" | "tv" = "all",
    timeWindow: "day" | "week" = "day"
  ) {
    return this.fetch(`/trending/${type}/${timeWindow}`);
  },

  async searchMulti(query: string) {
    return this.fetch(`/search/multi?query=${encodeURIComponent(query)}`);
  },

  async getGenres(type: "movie" | "tv" = "tv") {
    return this.fetch(`/genre/${type}/list`);
  },

  async discover(type: "movie" | "tv", params: Record<string, any> = {}) {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        // For comma-separated values like with_keywords, with_genres, etc., ensure proper encoding
        const stringValue = String(value);
        queryParams.append(key, stringValue);
      }
    });

    const queryString = queryParams.toString();
    const endpoint = `/discover/${type}?${queryString}`;

    const result = await this.fetch(endpoint);
    return result;
  },

  // Comprehensive Discover API with all filters
  async discoverMovie(params: TMDBDiscoverParams = {}) {
    return this.discover("movie", params);
  },

  async discoverTV(params: TMDBDiscoverParams = {}) {
    return this.discover("tv", params);
  },

  // Donghua-specific discover methods
  async discoverDonghua(params: TMDBDonghuaDiscoverParams = {}) {
    const {
      keywords,
      year,
      minRating,
      maxRating,
      minVoteCount,
      ...restParams
    } = params;

    const donghuaParams: Record<string, any> = {
      with_genres: "16", // Animation
      with_original_language: "zh", // Mandarin
      with_origin_country: "CN", // China
      include_adult: false,
      ...restParams,
    };

    // Add keywords if provided
    if (keywords && keywords.length > 0) {
      donghuaParams.with_keywords = keywords.join(",");
    }

    // Add year filter
    if (year) {
      donghuaParams.first_air_date_gte = `${year}-01-01`;
      donghuaParams.first_air_date_lte = `${year}-12-31`;
    }

    // Add rating filters
    if (minRating !== undefined) {
      donghuaParams.vote_average_gte = minRating;
    }
    if (maxRating !== undefined) {
      donghuaParams.vote_average_lte = maxRating;
    }
    if (minVoteCount !== undefined) {
      donghuaParams.vote_count_gte = minVoteCount;
    }

    return this.discover("tv", donghuaParams);
  },

  async discoverDonghuaCultivation(params: TMDBDonghuaDiscoverParams = {}) {
    return this.discoverDonghua({
      ...params,
      keywords: [DONGHUA_KEYWORDS.cultivation, DONGHUA_KEYWORDS.xianxia],
    });
  },

  // ------------------- Networks -------------------

  async getNetworkDetail(networkId: number) {
    return this.fetch(`/network/${networkId}`);
  },

  async getNetworkAlternativeNames(networkId: number) {
    return this.fetch(`/network/${networkId}/alternative_names`);
  },

  async getNetworkImages(networkId: number) {
    return this.fetch(`/network/${networkId}/images`);
  },

  // ------------------- Lists -------------------

  /**
   * Check if an item (movie or TV) exists in a TMDB list
   * @param listId - The ID of the TMDB list
   * @param movieId - Movie ID (if checking a movie)
   * @param tvId - TV ID (if checking a TV series)
   * @returns Object with id and item_present boolean
   */
  async checkListItemStatus(
    listId: string | number,
    movieId?: number,
    tvId?: number
  ) {
    if (!movieId && !tvId) {
      throw new Error("Either movieId or tvId must be provided");
    }

    const params = new URLSearchParams();
    if (movieId) {
      params.append("movie_id", movieId.toString());
    }
    if (tvId) {
      params.append("tv_id", tvId.toString());
    }

    return this.fetch(`/list/${listId}/item_status?${params.toString()}`);
  },

  /**
   * Get list details
   * @param listId - The ID of the TMDB list
   */
  async getListDetails(listId: string | number) {
    return this.fetch(`/list/${listId}`);
  },

  /**
   * Get list items
   * @param listId - The ID of the TMDB list
   */
  async getListItems(listId: string | number) {
    return this.fetch(`/list/${listId}`);
  },
};
