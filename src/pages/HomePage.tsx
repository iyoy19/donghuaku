import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { HeroBanner } from "@/components/HeroBanner";
import { TrendingCarousel } from "@/components/TrendingCarousel";
import { RecommendationGrid } from "@/components/RecommendationGrid";
import { api } from "@/services/api";
import { Donghua } from "@/types";

export function HomePage() {
  const [trending, setTrending] = useState<Donghua[]>([]);
  const [latest, setLatest] = useState<Donghua[]>([]);
  const [topRated, setTopRated] = useState<Donghua[]>([]);
  const [recommendations, setRecommendations] = useState<Donghua[]>([]);
  const [heroItems, setHeroItems] = useState<Donghua[]>([]);
  const [genreCollections, setGenreCollections] = useState<
    Record<string, Donghua[]>
  >({});
  const [latestEpisodes, setLatestEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const hasFetchedRef = useRef(false);

  // Transform database donghua to Donghua type
  function mapStatus(
    status: string | undefined
  ): "ongoing" | "completed" | "upcoming" {
    if (!status) return "ongoing";
    const s = status.toLowerCase();
    // Handle database enum value "complete" and other variations
    if (
      s === "complete" ||
      s === "ended" ||
      s === "completed" ||
      s === "finished"
    )
      return "completed";
    if (s === "upcoming" || s === "planned" || s === "in production")
      return "upcoming";
    return "ongoing";
  }

  const transformDatabaseDonghua = (donghua: any): Donghua => ({
    id: donghua.id,
    title: donghua.title,
    chineseTitle: donghua.chineseTitle,
    overview: donghua.overview || "",
    poster_path: donghua.posterPath || "",
    backdrop_path: donghua.backdropPath || "",
    posters: donghua.posters || [],
    release_date: donghua.releaseDate
      ? new Date(donghua.releaseDate).toISOString().split("T")[0]
      : undefined,
    first_air_date: donghua.firstAirDate
      ? new Date(donghua.firstAirDate).toISOString().split("T")[0]
      : undefined,
    vote_average: donghua.voteAverage || 0,
    vote_count: donghua.voteCount || 0,
    genre_ids: donghua.genreIds || [],
    genres: donghua.genres || [],
    status: mapStatus(donghua.status),
    episode_count: donghua.episodeCount || 0,
    media_type: (donghua.mediaType as "movie" | "tv") || "tv",
    released_episodes_count:
      donghua.released_episodes_count ||
      (donghua.episodes ? donghua.episodes.length : 0),
    keywords: donghua.keywords || [],
  });

  useEffect(() => {
    // Prevent duplicate fetches in React Strict Mode
    if (hasFetchedRef.current) {
      return;
    }
    hasFetchedRef.current = true;

    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch all sections in parallel
        const [latestData, trendingData, topRatedData, allDonghua] =
          await Promise.all([
            api.getLatestDonghua().catch((err) => {
              console.error("❌ Error fetching latest:", err);
              return { results: [] };
            }),
            api.getTrendingDonghua().catch((err) => {
              console.error("❌ Error fetching trending:", err);
              return { results: [] };
            }),
            api.getTopRatedDonghua().catch((err) => {
              console.error("❌ Error fetching top rated:", err);
              return { results: [] };
            }),
            api.getAllDonghua().catch((err) => {
              console.error("❌ Error fetching all donghua:", err);
              return [];
            }),
          ]);

        // Fetch genre collections
        const genreNames = [
          "xianxia",
          "cultivation",
          "fantasy-chinese",
          "wuxia",
          "action",
        ];
        const genreDataPromises = genreNames.map((name) =>
          api.getDonghuaByGenre(name).catch((err) => {
            console.error(`❌ Error fetching ${name}:`, err);
            return { results: [] };
          })
        );
        const genreDataResults = await Promise.all(genreDataPromises);

        console.log("📊 Fetched data from Database:", {
          latest: latestData?.results?.length || 0,
          trending: trendingData?.results?.length || 0,
          topRated: topRatedData?.results?.length || 0,
        });

        // Transform database results
        const latestItems = (latestData?.results || []).map(
          transformDatabaseDonghua
        );
        const trendingItems = (trendingData?.results || []).map(
          transformDatabaseDonghua
        );
        const topRatedItems = (topRatedData?.results || []).map(
          transformDatabaseDonghua
        );

        // Transform genre collections
        const genreCollectionsMap: Record<string, Donghua[]> = {};
        genreNames.forEach((name, index) => {
          genreCollectionsMap[name] = (
            genreDataResults[index]?.results || []
          ).map(transformDatabaseDonghua);
        });

        console.log("✅ Transformed items:", {
          latest: latestItems.length,
          trending: trendingItems.length,
          topRated: topRatedItems.length,
          genres: Object.keys(genreCollectionsMap).map(
            (k) => `${k}: ${genreCollectionsMap[k].length}`
          ),
        });

        setLatest(latestItems);
        setTrending(trendingItems);
        setTopRated(topRatedItems);
        setGenreCollections(genreCollectionsMap);

        // Set hero items from trending
        const heroItems = trendingItems.slice(0, 5);
        setHeroItems(heroItems);

        // Get recommendations from first trending item (if available)
        // Recommendations come from database based on genres
        let finalRecommendations: Donghua[] = [];

        if (trendingItems.length > 0) {
          try {
            const trendingId = trendingItems[0].id;
            console.log(
              "🔍 Fetching recommendations from database for ID:",
              trendingId
            );
            const recommendData = await api.getRecommendations(trendingId);
            console.log("📊 Recommendations raw data:", recommendData);
            const recommendItems = (recommendData?.results || []).map(
              transformDatabaseDonghua
            );
            console.log(
              "✅ Recommendations fetched:",
              recommendItems.length,
              "items"
            );

            if (recommendItems.length > 0) {
              finalRecommendations = recommendItems;
            } else {
              console.warn(
                "⚠️ No recommendations from database - section will be empty"
              );
              finalRecommendations = [];
            }
          } catch (error) {
            console.error("❌ Error fetching recommendations:", error);
            finalRecommendations = [];
          }
        } else {
          console.warn(
            "⚠️ No trending items to get recommendations from - section will be empty"
          );
          finalRecommendations = [];
        }

        setRecommendations(finalRecommendations);
        console.log(
          "✅ Final recommendations set:",
          finalRecommendations.length,
          "items"
        );

        // Get latest episodes from database (EXCLUDE Kids donghua)
        if (Array.isArray(allDonghua)) {
          // Filter out Kids donghua first
          const nonKidsDonghua = allDonghua.filter((donghua: any) => {
            // Check category field
            if (donghua.category === "Kids") return false;

            // Check genre IDs
            const genreIds = donghua.genreIds || [];
            if (genreIds.includes(10762)) return false; // Kids genre

            // Check genre names
            if (donghua.genres && Array.isArray(donghua.genres)) {
              const hasKidsGenre = donghua.genres.some(
                (g: any) =>
                  g.name &&
                  (g.name.toLowerCase().includes("kids") ||
                    g.name.toLowerCase().includes("family"))
              );
              if (hasKidsGenre) return false;
            }

            // Check title/overview
            const title = (donghua.title || "").toLowerCase();
            const overview = (donghua.overview || "").toLowerCase();
            const kidsKeywords = [
              "kids",
              "children",
              "child",
              "family",
              "preschool",
            ];
            if (
              kidsKeywords.some(
                (keyword) =>
                  title.includes(keyword) || overview.includes(keyword)
              )
            ) {
              return false;
            }

            return true;
          });

          const episodesWithDonghuaId = nonKidsDonghua.flatMap((donghua: any) =>
            (donghua.episodes || []).map((ep: any) => ({
              ...ep,
              donghuaId: donghua.id,
              donghuaTitle: donghua.title,
            }))
          );
          // Sort by creation date (newest first) and take latest 12
          const sortedEpisodes = episodesWithDonghuaId
            .sort((a: any, b: any) => {
              const dateA = a.createdAt
                ? new Date(a.createdAt).getTime()
                : a.airDate
                ? new Date(a.airDate).getTime()
                : a.episodeNumber || 0;
              const dateB = b.createdAt
                ? new Date(b.createdAt).getTime()
                : b.airDate
                ? new Date(b.airDate).getTime()
                : b.episodeNumber || 0;
              return dateB - dateA;
            })
            .slice(0, 12);
          setLatestEpisodes(sortedEpisodes);
        }
      } catch (error) {
        console.error("❌ Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Genre collection titles mapping
  const genreTitles: Record<string, string> = {
    xianxia: "Xianxia Donghua",
    cultivation: "Cultivation Donghua",
    "fantasy-chinese": "Fantasy Chinese",
    wuxia: "Wuxia",
    action: "Action",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      {/* 1. Hero Banner */}
      {heroItems.length > 0 && <HeroBanner items={heroItems} />}

      {/* 2. Trending Now (Section Utama) */}
      <TrendingCarousel
        items={trending}
        title="Trending Now"
        loading={loading}
      />

      {/* 3. Latest Releases */}
      <TrendingCarousel
        items={latest}
        title="Latest Releases"
        loading={loading}
      />

      {/* 4. Recommended For You (Optional) */}
      {recommendations.length > 0 && (
        <RecommendationGrid
          items={recommendations}
          title="Recommended For You"
          loading={loading}
        />
      )}

      {/* 5. Top Rated */}
      <TrendingCarousel items={topRated} title="Top Rated" loading={loading} />

      {/* 6. Genre Collections (5 line) */}
      {Object.entries(genreCollections).map(
        ([genreName, items]) =>
          items.length > 0 && (
            <TrendingCarousel
              key={genreName}
              items={items}
              title={genreTitles[genreName] || genreName}
              loading={loading}
            />
          )
      )}

      {/* 7. Latest Episodes */}
      {latestEpisodes.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold mb-6">Latest Episodes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {latestEpisodes.map((ep: any, index) => (
              <Link
                key={ep.id}
                to={`/watch/${ep.donghuaId}/${ep.episodeNumber}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="cursor-pointer group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={
                        ep.thumbnail || "https://via.placeholder.com/400x225"
                      }
                      alt={ep.title}
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <div>
                        <p className="text-white text-sm font-medium">
                          {ep.title}
                        </p>
                        <p className="text-white/80 text-xs">
                          Episode {ep.episodeNumber}
                        </p>
                      </div>
                    </div>
                    <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1">
                      <span className="text-xs font-medium text-white">
                        EP {ep.episodeNumber}
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
