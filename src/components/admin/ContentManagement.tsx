// Deduplication function based on tmdbId
const removeDuplicates = (items: any[]) => {
  const seen = new Set<number>();
  return items.filter((item) => {
    const tmdbId = item.id || item.tmdbId;
    if (!tmdbId || seen.has(tmdbId)) {
      return false;
    }
    seen.add(tmdbId);
    return true;
  });
};

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Film,
  Plus,
  Edit,
  List,
  Search,
  Filter,
  Download,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/image";
import { AdminDonghua, Genre, TMDBDiscoverParams } from "@/types";
import { motion } from "framer-motion";
import { getChineseMovies } from "@/services/movie";

export function ContentManagement() {
  // Add status filter for bulk add
  const [bulkAddStatus, setBulkAddStatus] = useState<
    "all" | "ongoing" | "complete" | "upcoming"
  >("all");
  // Media type filter for main list
  const [mediaTypeFilter, setMediaTypeFilter] = useState<
    "all" | "tv" | "movie"
  >("all");
  // Settings tab states for bulk add
  const [itemLimit, setItemLimit] = useState<"100" | "300" | "all">("100");
  const [maxPages, setMaxPages] = useState(5);
  const navigate = useNavigate();
  const [donghuaList, setDonghuaList] = useState<AdminDonghua[]>([]);
  const [filteredList, setFilteredList] = useState<AdminDonghua[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [genres, setGenres] = useState<Genre[]>([]);

  // Bulk add states
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false);
  const [bulkAddType, setBulkAddType] = useState<
    "donghua-china" | "donghua-movie-china" | "by-genre"
  >("donghua-china");
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null);
  const [bulkAddLoading, setBulkAddLoading] = useState(false);
  const [bulkAddProgress, setBulkAddProgress] = useState({
    current: 0,
    total: 0,
    message: "",
  });

  // Map TMDB status to badge status
  const mapStatus = (
    status: string | undefined
  ): "ongoing" | "complete" | "upcoming" => {
    if (!status) return "ongoing";
    const s = status.toLowerCase();
    // Map complete status for both TV and Movie
    if (["ended", "complete", "finished", "released", "canceled"].includes(s))
      return "complete";
    if (["upcoming", "planned", "in production"].includes(s)) return "upcoming";
    return "ongoing";
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔍 Fetching donghua from database...");
      const allDonghua = await api.getAllDonghua();
      console.log(`✅ Received ${allDonghua?.length || 0} donghua from API`);

      if (!Array.isArray(allDonghua)) {
        throw new Error("Invalid response format from API");
      }

      // Extract unique genres for bulk-add by genre
      const genreMap = new Map<number, Genre>();
      allDonghua.forEach((donghua: any) => {
        if (donghua.genres) {
          donghua.genres.forEach((genre: any) => {
            if (!genreMap.has(genre.id)) {
              genreMap.set(genre.id, genre);
            }
          });
        }
      });
      setGenres(Array.from(genreMap.values()));

      const transformedDonghua: AdminDonghua[] = allDonghua.map(
        (donghua: any) => ({
          id: donghua.id,
          tmdbId: donghua.tmdbId || 0,
          title: donghua.title,
          chineseTitle: donghua.chineseTitle,
          overview: donghua.overview,
          synopsis: donghua.synopsis || "",
          poster_path: donghua.posterPath,
          backdrop_path: donghua.backdropPath,
          posters: donghua.posters || [],
          release_date: donghua.releaseDate
            ? new Date(donghua.releaseDate).toISOString().split("T")[0]
            : undefined,
          first_air_date: donghua.firstAirDate
            ? new Date(donghua.firstAirDate).toISOString().split("T")[0]
            : undefined,
          vote_average: donghua.voteAverage,
          vote_count: donghua.voteCount,
          genre_ids: donghua.genreIds,
          genres: donghua.genres,
          status: mapStatus(donghua.status),
          episode_count: donghua.episodeCount,
          media_type: donghua.mediaType as "movie" | "tv",
        })
      );

      console.log(`✅ Transformed ${transformedDonghua.length} donghua`);
      setDonghuaList(transformedDonghua);
      setFilteredList(transformedDonghua);
    } catch (error) {
      console.error("❌ Error fetching donghua:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Gagal memuat data dari database. Pastikan server berjalan dan database terhubung.";
      setError(errorMessage);
      setDonghuaList([]);
      setFilteredList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = donghuaList;

    // Filter by media type if not 'all'
    if (mediaTypeFilter !== "all") {
      filtered = filtered.filter((item) => item.media_type === mediaTypeFilter);
    }

    // Filter by status if not 'all'
    if (bulkAddStatus !== "all") {
      filtered = filtered.filter((item) => item.status === bulkAddStatus);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.chineseTitle?.toLowerCase().includes(query) ||
          item.overview.toLowerCase().includes(query)
      );
    }
    setFilteredList(filtered);
  }, [searchQuery, donghuaList, bulkAddStatus, mediaTypeFilter]);

  const handleBulkAdd = async () => {
    setBulkAddLoading(true);
    setBulkAddProgress({ current: 0, total: 0, message: "Starting..." });

    // Helper function to filter and map status
    const filterDonghuaOnly = (
      items: any[],
      mediaTypeFilter?: "tv" | "movie",
      statusFilter?: "all" | "ongoing" | "complete" | "upcoming"
    ) => {
      function mapStatusHelper(
        status: string | undefined
      ): "ongoing" | "complete" | "upcoming" {
        if (!status) return "ongoing";
        const s = status.toLowerCase();
        if (
          ["ended", "complete", "finished", "released", "canceled"].includes(s)
        )
          return "complete";
        if (["upcoming", "planned", "in production"].includes(s))
          return "upcoming";
        return "ongoing";
      }

      return items.filter((item) => {
        // Check media type if specified
        if (
          mediaTypeFilter &&
          item.media_type &&
          item.media_type !== mediaTypeFilter
        )
          return false;

        // Basic validation
        if (!item.title && !item.name) return false;

        // Status filter (if needed)
        if (statusFilter && statusFilter !== "all") {
          const mapped = mapStatusHelper(item.status);
          if (mapped !== statusFilter) return false;
        }

        return true;
      });
    };

    try {
      const { tmdb } = await import("@/services/tmdb");
      let results: any[] = [];

      if (
        bulkAddType === "donghua-china" ||
        bulkAddType === "donghua-movie-china"
      ) {
        if (bulkAddType === "donghua-movie-china") {
          setBulkAddProgress({
            current: 0,
            total: 0,
            message: "Fetching Movie China using getChineseMovies()...",
          });
          results = await getChineseMovies();

          // Filter status if needed
          if (bulkAddStatus !== "all") {
            results = results.filter((m) => {
              const status = mapStatus(m.status);
              return status === bulkAddStatus;
            });
          }

          // Trim results based on itemLimit
          if (itemLimit === "100") {
            results = results.slice(0, 100);
          } else if (itemLimit === "300") {
            results = results.slice(0, 300);
          }

          // Map results to expected format for syncFromTMDB
          results = results.map((m) => ({
            ...m,
            tmdbId: m.id,
            release_date: m.release_date || "",
            type: m.type || "movie",
          }));
          results = removeDuplicates(results);
        } else {
          // TV series (donghua-china)
          const mediaType = "tv";
          setBulkAddProgress({
            current: 0,
            total: 0,
            message: `Fetching Series China (Donghua) from TMDB...`,
          });

          const donghuaParams: TMDBDiscoverParams = {
            with_origin_country: "CN",
            with_original_language: "zh",
            with_genres: "16",
            without_genres: "10751",
            without_keywords: "children,kids,family",
            sort_by: "popularity.desc",
            include_adult: false,
          };

          const targetPages =
            itemLimit === "all" ? maxPages : itemLimit === "100" ? 5 : 15;

          const firstPageData = await tmdb.discover(mediaType, {
            ...donghuaParams,
            page: 1,
          });

          console.log(
            `📊 TMDB ${mediaType} page 1 raw results:`,
            firstPageData.results?.length
          );

          results = filterDonghuaOnly(
            firstPageData.results || [],
            mediaType,
            bulkAddStatus
          );

          console.log(`✅ After filtering page 1: ${results.length} items`);
          results = removeDuplicates(results);
          console.log(`✅ After dedup page 1: ${results.length} items`);

          const totalPages = Math.min(
            firstPageData.total_pages || 1,
            targetPages
          );

          for (let page = 2; page <= totalPages; page++) {
            setBulkAddProgress({
              current: results.length,
              total: 0,
              message: `Fetching page ${page}...`,
            });

            const pageData = await tmdb.discover(mediaType, {
              ...donghuaParams,
              page,
            });

            const filteredPageResults = filterDonghuaOnly(
              pageData.results || [],
              mediaType,
              bulkAddStatus
            );

            results = [...results, ...filteredPageResults];
            results = removeDuplicates(results);

            if (itemLimit === "100" && results.length >= 100) break;
            if (itemLimit === "300" && results.length >= 300) break;
          }

          if (itemLimit === "100") {
            results = results.slice(0, 100);
          } else if (itemLimit === "300") {
            results = results.slice(0, 300);
          }
        }
      } else if (bulkAddType === "by-genre" && selectedGenreId) {
        setBulkAddProgress({
          current: 0,
          total: 0,
          message: "Fetching Series China by genre from TMDB...",
        });

        const genreParams: TMDBDiscoverParams = {
          with_origin_country: "CN",
          with_original_language: "zh",
          with_genres: `16,${selectedGenreId}`,
          without_genres: "10751",
          without_keywords: "children,kids,family",
          sort_by: "popularity.desc",
          include_adult: false,
        };

        const targetPages =
          itemLimit === "all" ? maxPages : itemLimit === "100" ? 5 : 15;

        const tvData = await tmdb.discoverTV({ ...genreParams, page: 1 });
        console.log(
          `📊 TMDB TV by-genre page 1 raw results:`,
          tvData.results?.length
        );

        results = filterDonghuaOnly(tvData.results || [], "tv", bulkAddStatus);
        console.log(`✅ After filtering page 1: ${results.length} items`);
        results = removeDuplicates(results);
        console.log(`✅ After dedup page 1: ${results.length} items`);

        const totalPages = Math.min(tvData.total_pages || 1, targetPages);

        for (let page = 2; page <= totalPages; page++) {
          setBulkAddProgress({
            current: results.length,
            total: 0,
            message: `Fetching page ${page}...`,
          });

          const pageData = await tmdb.discoverTV({ ...genreParams, page });
          const filteredPageResults = filterDonghuaOnly(
            pageData.results || [],
            "tv",
            bulkAddStatus
          );

          results = [...results, ...filteredPageResults];
          results = removeDuplicates(results);

          if (itemLimit === "100" && results.length >= 100) break;
          if (itemLimit === "300" && results.length >= 300) break;
        }

        if (itemLimit === "100") {
          results = results.slice(0, 100);
        } else if (itemLimit === "300") {
          results = results.slice(0, 300);
        }
      }

      // Final deduplication before import
      results = removeDuplicates(results);
      setBulkAddProgress({
        current: 0,
        total: results.length,
        message: `Found ${results.length} items (after deduplication). Starting import...`,
      });

      let successCount = 0;
      let errorCount = 0;
      const existingTmdbIds = new Set(
        donghuaList.map((d) => d.tmdbId).filter((id) => id && id > 0)
      );

      for (let i = 0; i < results.length; i++) {
        const item = results[i];
        const itemType = bulkAddType === "donghua-movie-china" ? "movie" : "tv";

        // Skip if already exists
        if (existingTmdbIds.has(item.id)) {
          setBulkAddProgress({
            current: i + 1,
            total: results.length,
            message: `Skipping ${item.title || item.name} (already exists)...`,
          });
          continue;
        }

        setBulkAddProgress({
          current: i + 1,
          total: results.length,
          message: `Adding ${item.title || item.name}...`,
        });

        try {
          await api.syncFromTMDB({
            tmdbId: item.id,
            type: itemType,
            status: "ongoing",
            episodeCount:
              itemType === "tv" ? item.number_of_episodes || 0 : undefined,
            releaseDate:
              itemType === "movie" && item.release_date
                ? item.release_date
                : undefined,
            firstAirDate:
              itemType === "tv" && item.first_air_date
                ? item.first_air_date
                : undefined,
            voteAverage: item.vote_average || 0,
            voteCount: item.vote_count || 0,
          });
          successCount++;
        } catch (error) {
          console.error(`Error adding ${item.title || item.name}:`, error);
          errorCount++;
        }

        // Small delay to avoid rate limiting
        if (i < results.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      setBulkAddProgress({
        current: results.length,
        total: results.length,
        message: `Completed! Success: ${successCount}, Errors: ${errorCount}`,
      });

      // Refresh the list
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Bulk add error:", error);
      setBulkAddProgress({
        current: 0,
        total: 0,
        message: `Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setBulkAddLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            Kelola donghua dan episode
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/add-episode")}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Episode
          </Button>
          <Button
            onClick={() => navigate("/admin/add-donghua")}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tambah Donghua
          </Button>
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 border-yellow-600"
            onClick={() => setBulkAddDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            Tambah Donghua All List
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cari donghua..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filter:</span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <select
                  value={mediaTypeFilter}
                  onChange={(e) =>
                    setMediaTypeFilter(e.target.value as "all" | "tv" | "movie")
                  }
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Type: All</option>
                  <option value="tv">Type: Series</option>
                  <option value="movie">Type: Movie</option>
                </select>
                <select
                  value={bulkAddStatus}
                  onChange={(e) =>
                    setBulkAddStatus(
                      e.target.value as
                        | "all"
                        | "ongoing"
                        | "complete"
                        | "upcoming"
                    )
                  }
                  className="flex h-9 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="all">Status: All</option>
                  <option value="ongoing">Status: Ongoing</option>
                  <option value="complete">Status: Complete</option>
                  <option value="upcoming">Status: Upcoming</option>
                </select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="flex gap-3 p-3">
                <div className="w-20 h-28 rounded-md bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <p className="text-destructive font-medium mb-2">
              Error Memuat Data
            </p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={() => {
                setError(null);
                fetchData();
              }}
              variant="outline"
            >
              Coba Lagi
            </Button>
          </CardContent>
        </Card>
      ) : filteredList.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">
              Tidak ada donghua ditemukan
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {donghuaList.length === 0
                ? "Belum ada donghua di database. Coba tambah donghua terlebih dahulu."
                : searchQuery ||
                  bulkAddStatus !== "all" ||
                  mediaTypeFilter !== "all"
                ? "Coba ubah filter atau cari dengan keyword lain"
                : "Tidak ada data yang tersedia"}
            </p>
            {donghuaList.length === 0 && (
              <div className="mt-4">
                <Button
                  onClick={() => navigate("/admin/add-donghua")}
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Donghua Pertama
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Total: {filteredList.length} donghua
              {mediaTypeFilter !== "all" &&
                ` (${mediaTypeFilter === "tv" ? "Series" : "Movie"})`}
              {bulkAddStatus !== "all" && ` • Status: ${bulkAddStatus}`}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredList.slice(0, 30).map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="overflow-hidden hover:shadow-md transition-shadow">
                  <div className="flex gap-3 p-3">
                    <div className="relative w-20 h-28 flex-shrink-0 rounded-md overflow-hidden bg-muted">
                      {item.poster_path && (
                        <img
                          src={getImageUrl(item.poster_path)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                      <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
                        {item.media_type === "tv" ? "TV" : "Movie"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-1.5">
                      <div className="space-y-0.5">
                        <h3 className="font-semibold text-sm line-clamp-1">
                          {item.title}
                        </h3>
                        {item.chineseTitle && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1">
                            {item.chineseTitle}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {item.overview}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1">
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              item.status === "complete"
                                ? "bg-green-100 text-green-700 border border-green-400 px-1.5 py-0.5 rounded font-semibold"
                                : item.status === "upcoming"
                                ? "bg-yellow-100 text-yellow-700 border border-yellow-400 px-1.5 py-0.5 rounded font-semibold"
                                : "bg-blue-100 text-blue-700 border border-blue-400 px-1.5 py-0.5 rounded font-semibold"
                            }
                          >
                            {item.status === "complete"
                              ? "Complete"
                              : item.status === "upcoming"
                              ? "Upcoming"
                              : "Ongoing"}
                          </span>
                          <span className="text-muted-foreground">
                            {item.episode_count || 0} eps
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          {item.vote_average ? (
                            <span>{item.vote_average.toFixed(1)}</span>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] flex-1 gap-1"
                          onClick={() =>
                            navigate(`/admin/edit-donghua/${item.id}`)
                          }
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px] flex-1 gap-1"
                          onClick={() =>
                            navigate(`/admin/add-episode?donghuaId=${item.id}`)
                          }
                        >
                          <Film className="h-3 w-3" />
                          Add Ep
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={setBulkAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Tambah Donghua All List
            </DialogTitle>
            <DialogClose onClose={() => setBulkAddDialogOpen(false)} />
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Jumlah Item yang Diambil
              </label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={itemLimit}
                onChange={(e) =>
                  setItemLimit(e.target.value as "100" | "300" | "all")
                }
              >
                <option value="100">100 Items</option>
                <option value="300">300 Items</option>
                <option value="all">All Items (Semua)</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Pilih jumlah item yang akan diambil dari TMDB. "All" akan
                mengambil semua item yang tersedia (tergantung max pages).
                Duplikat akan otomatis dihapus.
              </p>
            </div>
            {itemLimit === "all" && (
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Maksimal Halaman
                </label>
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={maxPages}
                  onChange={(e) => setMaxPages(Number(e.target.value))}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Digunakan hanya jika memilih "All".
                </p>
              </div>
            )}
            {!bulkAddLoading ? (
              <>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    Fitur ini akan menambahkan donghua secara massal dari TMDB.
                    Proses ini mungkin memakan waktu beberapa menit.
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pilih Tipe
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent border-primary">
                        <input
                          type="radio"
                          name="bulkType"
                          value="donghua-china"
                          checked={bulkAddType === "donghua-china"}
                          onChange={(e) =>
                            setBulkAddType(e.target.value as any)
                          }
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">
                            Series China (Donghua/C-Drama) — TV Series
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Filter: Origin CN + Bahasa zh + Animation (16) +
                            Exclude Family (anti-kids) + Remove keywords:
                            children,kids,family
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer hover:bg-accent border-blue-500">
                        <input
                          type="radio"
                          name="bulkType"
                          value="donghua-movie-china"
                          checked={bulkAddType === "donghua-movie-china"}
                          onChange={(e) =>
                            setBulkAddType(e.target.value as any)
                          }
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">
                            Movie China — Movie (Film/OVA)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Filter: Origin CN + Bahasa zh + Exclude Family
                            (10751) & Animation (16) (anti-kids) + Remove
                            keywords: children,kids,family
                          </p>
                        </div>
                      </label>
                      <label className="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-accent">
                        <input
                          type="radio"
                          name="bulkType"
                          value="by-genre"
                          checked={bulkAddType === "by-genre"}
                          onChange={(e) =>
                            setBulkAddType(e.target.value as any)
                          }
                          className="h-4 w-4"
                        />
                        <div>
                          <p className="font-medium">
                            By Genre (Custom) — Series with selected genre
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Filter: Origin CN + Bahasa zh + Genre: Animation(16)
                            + selected genre + Exclude Family (anti-kids) +
                            Remove kids keywords
                          </p>
                        </div>
                      </label>
                    </div>
                  </div>

                  {bulkAddType === "by-genre" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Pilih Genre
                      </label>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedGenreId || ""}
                        onChange={(e) =>
                          setSelectedGenreId(
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                      >
                        <option value="">Pilih Genre</option>
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setBulkAddDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleBulkAdd}
                      disabled={bulkAddType === "by-genre" && !selectedGenreId}
                      className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Mulai Import
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">{bulkAddProgress.message}</p>
                  {bulkAddProgress.total > 0 && (
                    <>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{
                            width: `${
                              (bulkAddProgress.current /
                                bulkAddProgress.total) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {bulkAddProgress.current} / {bulkAddProgress.total}
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {filteredList.length > 12 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => navigate("/admin/manage")}>
            <List className="h-4 w-4 mr-2" />
            Lihat Semua ({filteredList.length})
          </Button>
        </div>
      )}
    </div>
  );
}
