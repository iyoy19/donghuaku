// Determine API URL based on environment
const getApiUrl = (): string => {
  // If VITE_API_URL is set, use it
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // For development, use localhost:3001
  if (import.meta.env.DEV) {
    return "http://localhost:3001";
  }

  // For production (Vercel), use relative path to /api
  return "/api";
};

const API_URL = getApiUrl();

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const method = options.method || "GET";

    // Add cache control headers to prevent 304 responses
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...options.headers,
    };

    // const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store", // Prevent browser caching
    });
    // const duration = Date.now() - startTime;

    if (!response.ok) {
      // Try to get error message from response body
      let errorMessage = `API Error: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error("🔴 [API DEBUG] Error response:", errorData);
        if (errorData.error) {
          errorMessage = `API Error: ${errorData.error}`;
        } else if (errorData.message) {
          errorMessage = `API Error: ${errorData.message}`;
        }
      } catch (e) {
        // If JSON parsing fails, use default error message
        console.error("🔴 [API DEBUG] Failed to parse error response:", e);
      }
      console.error("🔴 [API DEBUG] Request failed:", {
        url,
        method,
        status: response.status,
        statusText: response.statusText,
        errorMessage,
      });
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  // Health check
  async healthCheck() {
    return this.get<{ status: string; database: string; timestamp: string }>(
      "/health"
    );
  }

  // Test database connection
  async testDatabase() {
    return this.get<{
      success: boolean;
      message?: string;
      version?: string;
      error?: string;
    }>("/api/test-db");
  }

  // Donghua endpoints
  async getAllDonghua(forceRefresh: boolean = false) {
    // Add timestamp to bypass cache if force refresh is needed
    const endpoint = forceRefresh
      ? `/api/donghua?_t=${Date.now()}`
      : "/api/donghua";
    return this.get<any[]>(endpoint);
  }

  async getDonghuaById(id: number) {
    return this.get<any>(`/api/donghua/${id}`);
  }

  async getEpisodesByDonghuaId(donghuaId: number) {
    return this.get<any[]>(`/api/donghua/${donghuaId}/episodes`);
  }

  async getEpisodeById(episodeId: string) {
    return this.get<any>(`/api/episodes/${episodeId}`);
  }

  async searchDonghua(params: {
    q?: string;
    genre?: number;
    status?: string;
    sortBy?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append("q", params.q);
    if (params.genre) queryParams.append("genre", params.genre.toString());
    if (params.status) queryParams.append("status", params.status);
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);

    const queryString = queryParams.toString();
    return this.get<any[]>(
      `/api/search${queryString ? `?${queryString}` : ""}`
    );
  }

  // TMDB endpoints
  async searchTMDB(query: string, type?: "movie" | "tv") {
    const params = new URLSearchParams({ q: query });
    if (type) params.append("type", type);
    return this.get<any>(`/api/tmdb/search?${params.toString()}`);
  }

  async getTMDBData(type: "movie" | "tv", id: number) {
    return this.get<any>(`/api/tmdb/${type}/${id}`);
  }

  async syncFromTMDB(data: {
    tmdbId: number;
    type: "movie" | "tv";
    status?: string;
    chineseTitle?: string;
    synopsis?: string;
    voteAverage?: number;
    voteCount?: number;
    episodeCount?: number;
    releaseDate?: string;
    firstAirDate?: string;
  }) {
    try {
      const result = await this.post<any>("/api/tmdb/sync", data);
      return result;
    } catch (error) {
      console.error("🔴 [API DEBUG] syncFromTMDB error:", error);
      console.error(
        "🔴 [API DEBUG] Request data that failed:",
        JSON.stringify(data, null, 2)
      );
      throw error;
    }
  }

  async getTMDBCredits(type: "movie" | "tv", id: number) {
    return this.get<any>(`/api/tmdb/${type}/${id}/credits`);
  }

  async getTMDBVideos(type: "movie" | "tv", id: number) {
    return this.get<any>(`/api/tmdb/${type}/${id}/videos`);
  }

  async getTMDBEpisodeFull(tvId: number, season: number, episode: number) {
    return this.get<any>(
      `/api/tmdb/tv/${tvId}/season/${season}/episode/${episode}`
    );
  }

  // Admin endpoints
  async updateDonghua(id: number, data: any) {
    return this.put<any>(`/api/admin/donghua/${id}`, data);
  }

  async deleteDonghua(id: number) {
    return this.delete<{ success: boolean; message: string }>(
      `/api/admin/donghua/${id}`
    );
  }

  async createEpisode(data: any) {
    return this.post<any>("/api/admin/episodes", data);
  }

  async updateEpisode(id: string, data: any) {
    return this.put<any>(`/api/admin/episodes/${id}`, data);
  }

  async deleteEpisode(id: string) {
    return this.delete<{ success: boolean; message: string }>(
      `/api/admin/episodes/${id}`
    );
  }

  async getStatistics() {
    return this.get<any>("/api/admin/statistics");
  }

  // Donghua section endpoints
  async getOngoingDonghua() {
    return this.get<{ results: any[] }>("/api/donghua/ongoing");
  }

  async getLatestDonghua() {
    return this.get<{ results: any[] }>("/api/donghua/latest");
  }

  async getTrendingDonghua() {
    return this.get<{ results: any[] }>("/api/donghua/trending");
  }

  async getTopRatedDonghua() {
    return this.get<{ results: any[] }>("/api/donghua/top-rated");
  }

  async getRecommendations(donghuaId: number) {
    // Now uses database ID, not TMDB ID
    return this.get<{ results: any[] }>(`/api/donghua/recommend/${donghuaId}`);
  }

  async getDonghuaByGenre(genreName: string) {
    return this.get<{ results: any[] }>(`/api/donghua/genre/${genreName}`);
  }

  async getKidsDonghua() {
    return this.get<{ results: any[] }>("/api/donghua/kids");
  }

  // Admin: Import donghua from TMDB
  async importFromTMDB(
    type: "popular" | "trending" | "top_rated" = "popular",
    limit: number = 20
  ) {
    return this.post<{
      success: boolean;
      message: string;
      imported: number;
      updated: number;
      errors: number;
    }>("/api/admin/import/tmdb", {
      type,
      limit,
    });
  }
}

export const api = new ApiService(API_URL);
