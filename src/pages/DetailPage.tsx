import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Calendar,
  Play,
  Heart,
  Clock,
  Users,
  Film,
  Video,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EpisodeList } from "@/components/EpisodeList";
import { RecommendationGrid } from "@/components/RecommendationGrid";
import { SkeletonCard } from "@/components/SkeletonCard";
import { api } from "@/services/api";
import { getImageUrl } from "@/utils/image";
import { Donghua, Episode } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

interface Cast {
  id: number;
  name: string;
  character?: string;
  profile_path?: string;
  order: number;
}

interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path?: string;
}

interface Video {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
}

export function DetailPage() {
  const { id } = useParams<{ id: string }>();
  const [donghua, setDonghua] = useState<Donghua | null>(null);
  const [recommendations, setRecommendations] = useState<Donghua[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [cast, setCast] = useState<Cast[]>([]);
  const [crew, setCrew] = useState<Crew[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [productionCompanies, setProductionCompanies] = useState<any[]>([]);
  const [runtime, setRuntime] = useState<number | null>(null);
  const [donghuaData, setDonghuaData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedPoster, setSelectedPoster] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const donghuaId = parseInt(id);

        // Fetch donghua and episodes from database
        const [donghuaData, episodesData] = await Promise.all([
          api.getDonghuaById(donghuaId),
          api.getEpisodesByDonghuaId(donghuaId),
        ]);

        // Store raw donghua data for synopsis
        setDonghuaData(donghuaData);

        // Transform database data to match Donghua type
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
        // Filter only episodes that have airDate in the past or today (released)
        const nowDate = new Date();
        const releasedEpisodes = episodesData.filter((ep: any) => {
          if (!ep.airDate) return false; // exclude episodes without airDate
          const airDateObj = new Date(ep.airDate);
          return airDateObj <= nowDate;
        });

        const transformedDonghua: Donghua = {
          id: donghuaData.id,
          title: donghuaData.title,
          chineseTitle: donghuaData.chineseTitle,
          overview: donghuaData.overview,
          poster_path: donghuaData.posterPath,
          backdrop_path: donghuaData.backdropPath,
          posters: donghuaData.posters || [],
          release_date: donghuaData.releaseDate
            ? new Date(donghuaData.releaseDate).toISOString().split("T")[0]
            : undefined,
          first_air_date: donghuaData.firstAirDate
            ? new Date(donghuaData.firstAirDate).toISOString().split("T")[0]
            : undefined,
          vote_average: donghuaData.voteAverage,
          vote_count: donghuaData.voteCount,
          genre_ids: donghuaData.genreIds,
          genres: donghuaData.genres,
          status: mapStatus(donghuaData.status),
          episode_count: releasedEpisodes.length, // Use only released episodes count
          media_type: donghuaData.mediaType as "movie" | "tv",
          released_episodes_count: releasedEpisodes.length,
          keywords: donghuaData.keywords || [], // Include keywords from database
        };
        setDonghua(transformedDonghua);

        // Fetch additional data from TMDB if tmdbId exists
        if (donghuaData.tmdbId && donghuaData.mediaType) {
          try {
            const [creditsData, videosData, tmdbDetail] = await Promise.all([
              api.getTMDBCredits(
                donghuaData.mediaType as "movie" | "tv",
                donghuaData.tmdbId
              ),
              api.getTMDBVideos(
                donghuaData.mediaType as "movie" | "tv",
                donghuaData.tmdbId
              ),
              api.getTMDBData(
                donghuaData.mediaType as "movie" | "tv",
                donghuaData.tmdbId
              ),
            ]);

            // Set cast (top 10)
            setCast(
              (creditsData.cast || []).slice(0, 10).map((c: any) => ({
                id: c.id,
                name: c.name,
                character: c.character,
                profile_path: c.profile_path,
                order: c.order,
              }))
            );

            // Set crew (directors, writers, producers)
            const importantCrew = (creditsData.crew || [])
              .filter((c: any) =>
                [
                  "Director",
                  "Writer",
                  "Producer",
                  "Executive Producer",
                  "Screenplay",
                  "Creator",
                ].includes(c.job)
              )
              .slice(0, 10);
            setCrew(
              importantCrew.map((c: any) => ({
                id: c.id,
                name: c.name,
                job: c.job,
                department: c.department,
                profile_path: c.profile_path,
              }))
            );

            // Set videos (trailers and teasers)
            const trailerVideos = (videosData.results || [])
              .filter((v: any) => v.type === "Trailer" || v.type === "Teaser")
              .slice(0, 5);
            setVideos(
              trailerVideos.map((v: any) => ({
                id: v.id,
                key: v.key,
                name: v.name,
                site: v.site,
                type: v.type,
              }))
            );

            // Set production companies
            setProductionCompanies(
              tmdbDetail.production_companies || tmdbDetail.networks || []
            );

            // Set runtime
            setRuntime(
              tmdbDetail.runtime || tmdbDetail.episode_run_time?.[0] || null
            );
          } catch (err) {
            console.error("Error fetching additional TMDB data:", err);
          }
        }

        // Transform episodes
        const transformedEpisodes: Episode[] = releasedEpisodes.map(
          (ep: any) => ({
            id: ep.id,
            episodeNumber: ep.episodeNumber,
            title: ep.title,
            thumbnail: ep.thumbnail,
            duration: ep.duration,
            servers: ep.servers || [],
            subtitles: ep.subtitles || [],
            airDate: ep.airDate
              ? new Date(ep.airDate).toISOString().split("T")[0]
              : undefined,
          })
        );
        setEpisodes(transformedEpisodes);

        // Get recommendations from database (other donghua with similar genres)
        if (donghuaData.genres && donghuaData.genres.length > 0) {
          const genreIds = donghuaData.genres.map((g: any) => g.id);
          const allDonghua = await api.getAllDonghua();
          const similarDonghua = allDonghua
            .filter((d: any) => {
              if (d.id === donghuaId) return false;
              return (
                d.genreIds &&
                d.genreIds.some((gId: number) => genreIds.includes(gId))
              );
            })
            .slice(0, 12)
            .map((d: any) => ({
              id: d.id,
              title: d.title,
              chineseTitle: d.chineseTitle,
              overview: d.overview,
              poster_path: d.posterPath,
              backdrop_path: d.backdropPath,
              posters: d.posters || [],
              release_date: d.releaseDate
                ? new Date(d.releaseDate).toISOString().split("T")[0]
                : undefined,
              first_air_date: d.firstAirDate
                ? new Date(d.firstAirDate).toISOString().split("T")[0]
                : undefined,
              vote_average: d.voteAverage,
              vote_count: d.voteCount,
              genre_ids: d.genreIds,
              genres: d.genres,
              status: d.status,
              episode_count: d.episodes ? d.episodes.length : 0, // Use released episodes count
              media_type: d.mediaType as "movie" | "tv",
              released_episodes_count: d.episodes ? d.episodes.length : 0,
            }));
          setRecommendations(similarDonghua);
        }
      } catch (error) {
        console.error("Error fetching detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <SkeletonCard />
          </div>
          <div className="md:col-span-2 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!donghua) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <div className="max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-foreground">
            Donghua Not Found
          </h2>
          <p className="text-muted-foreground mb-6">
            The donghua you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/">
            <Button>Go Back Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <div
        className="relative h-[400px] md:h-[500px] bg-cover bg-center"
        style={{
          backgroundImage: `url(${getImageUrl(
            donghua.backdrop_path,
            "original"
          )})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      <div className="container mx-auto px-4 py-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Card
              className="overflow-hidden shadow-lg cursor-pointer hover:scale-105 transition-transform"
              onClick={() =>
                donghua.poster_path && setSelectedPoster(donghua.poster_path)
              }
            >
              <img
                src={getImageUrl(donghua.poster_path, "original")}
                alt={donghua.title}
                className="w-full aspect-[2/3] object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
            </Card>
          </div>

          <div className="md:col-span-3 space-y-6">
            <div className="bg-card/50 backdrop-blur-sm rounded-lg p-6 shadow-lg">
              <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground">
                {donghua.title}
              </h1>
              {donghua.chineseTitle && (
                <h2 className="text-xl md:text-2xl text-muted-foreground mb-4">
                  {donghua.chineseTitle}
                </h2>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                {donghua.vote_average > 0 && (
                  <div className="flex items-center space-x-1 bg-yellow-500/10 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-foreground">
                      {donghua.vote_average.toFixed(1)}
                    </span>
                    {donghua.vote_count > 0 && (
                      <span className="text-muted-foreground text-sm">
                        ({donghua.vote_count.toLocaleString()})
                      </span>
                    )}
                  </div>
                )}
                {(donghua.release_date || donghua.first_air_date) && (
                  <div className="flex items-center space-x-1 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {new Date(
                        donghua.release_date || donghua.first_air_date || ""
                      ).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {runtime && (
                  <div className="flex items-center space-x-1 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Clock className="h-4 w-4" />
                    <span>{runtime} min</span>
                  </div>
                )}
                {donghua.episode_count && donghua.episode_count > 0 && (
                  <div className="flex items-center space-x-1 text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
                    <Film className="h-4 w-4" />
                    <span>{donghua.episode_count} Episodes</span>
                  </div>
                )}
                {donghua.status && (
                  <div className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium">
                    <span
                      className={
                        donghua.status === "completed"
                          ? "bg-green-100 text-green-700 border border-green-400 px-1.5 py-0.5 rounded font-semibold"
                          : donghua.status === "upcoming"
                          ? "bg-yellow-100 text-yellow-700 border border-yellow-400 px-1.5 py-0.5 rounded font-semibold"
                          : "bg-blue-100 text-blue-700 border border-blue-400 px-1.5 py-0.5 rounded font-semibold"
                      }
                    >
                      {donghua.status === "completed"
                        ? "Completed"
                        : donghua.status === "upcoming"
                        ? "Upcoming"
                        : "Ongoing"}
                    </span>
                  </div>
                )}
              </div>

              {donghua.genres && donghua.genres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {donghua.genres.map((genre) => (
                    <span
                      key={genre.id}
                      className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm font-medium"
                    >
                      {genre.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
                {episodes.length > 0 && (
                  <Link
                    to={`/watch/${id}/${episodes[0].episodeNumber}`}
                    className="flex-1 sm:flex-none"
                  >
                    <Button size="lg" className="gap-2 w-full sm:w-auto">
                      <Play className="h-5 w-5" />
                      Watch Now
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="lg"
                  className="gap-2 flex-1 sm:flex-none w-full sm:w-auto"
                >
                  <Heart className="h-5 w-5" />
                  <span className="hidden sm:inline">Add to Favorites</span>
                  <span className="sm:hidden">Favorites</span>
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    Overview
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-base">
                    {donghua.overview || "No overview available."}
                  </p>
                </div>
                {donghuaData?.synopsis &&
                  donghuaData.synopsis !== donghuaData.overview && (
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-lg font-semibold mb-2 text-foreground">
                        Synopsis
                      </h4>
                      <p className="text-muted-foreground leading-relaxed text-base">
                        {donghuaData.synopsis}
                      </p>
                    </div>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information Tabs */}
        <div className="mt-12">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 max-w-full sm:max-w-md">
              <TabsTrigger value="info" className="text-xs sm:text-sm">
                Information
              </TabsTrigger>
              {cast.length > 0 && (
                <TabsTrigger value="cast" className="text-xs sm:text-sm">
                  Cast & Crew
                </TabsTrigger>
              )}
              {videos.length > 0 && (
                <TabsTrigger value="videos" className="text-xs sm:text-sm">
                  Videos
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="info" className="mt-6">
              <div className="space-y-6">
                {/* More Posters */}
                {donghua.posters && donghua.posters.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-foreground">
                      More Posters
                    </h3>
                    <div
                      className="overflow-x-auto scrollbar-hide"
                      style={{ scrollBehavior: "smooth" }}
                    >
                      <div className="flex gap-4 pb-4">
                        {donghua.posters.map((poster, index) => (
                          <Card
                            key={index}
                            className="flex-shrink-0 w-48 overflow-hidden cursor-pointer hover:scale-105 transition-transform shadow-md"
                            onClick={() => setSelectedPoster(poster)}
                          >
                            <img
                              src={getImageUrl(poster, "original")}
                              alt={`${donghua.title} poster ${index + 1}`}
                              className="w-full aspect-[2/3] object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  "/placeholder.jpg";
                              }}
                            />
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Production Companies */}
                {productionCompanies.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-foreground">
                      <Film className="h-5 w-5" />
                      {donghua.media_type === "movie"
                        ? "Production Companies"
                        : "Networks"}
                    </h3>
                    <div className="overflow-x-auto scrollbar-hide">
                      <div className="flex gap-4 pb-4">
                        {productionCompanies.map((company) => (
                          <Card
                            key={company.id}
                            className="flex-shrink-0 p-4 shadow-md"
                          >
                            <div className="flex flex-col items-center gap-2 min-w-[150px]">
                              {company.logo_path && (
                                <img
                                  src={getImageUrl(company.logo_path, "w154")}
                                  alt={company.name}
                                  className="h-16 object-contain max-w-[150px]"
                                  onError={(e) => {
                                    (
                                      e.target as HTMLImageElement
                                    ).style.display = "none";
                                  }}
                                />
                              )}
                              <span className="text-sm font-medium text-foreground text-center">
                                {company.name}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    Details
                  </h3>
                  <Card className="shadow-md">
                    <CardContent className="p-6 space-y-4">
                      {donghua.genres && donghua.genres.length > 0 && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-2">
                            Genres
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {donghua.genres.map((genre) => (
                              <span
                                key={genre.id}
                                className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm"
                              >
                                {genre.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {donghua.status && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">
                            Status
                          </p>
                          <p className="text-foreground">{donghua.status}</p>
                        </div>
                      )}
                      {donghua.media_type && (
                        <div>
                          <p className="text-sm font-semibold text-muted-foreground mb-1">
                            Type
                          </p>
                          <p className="text-foreground capitalize">
                            {donghua.media_type}
                          </p>
                        </div>
                      )}
                      {donghuaData?.keywords &&
                        Array.isArray(donghuaData.keywords) &&
                        donghuaData.keywords.length > 0 && (
                          <div>
                            <p className="text-sm font-semibold text-muted-foreground mb-2">
                              Keywords
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {donghuaData.keywords.map(
                                (keyword: any, index: number) => (
                                  <span
                                    key={keyword.id || index}
                                    className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-sm"
                                  >
                                    {keyword.name || keyword}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {cast.length > 0 && (
              <TabsContent value="cast" className="mt-6">
                <div className="space-y-8">
                  {cast.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                        <Users className="h-5 w-5" />
                        Cast
                      </h3>
                      <div
                        className="overflow-x-auto scrollbar-hide"
                        style={{ scrollBehavior: "smooth" }}
                      >
                        <div className="flex gap-4 pb-4">
                          {cast.map((actor) => (
                            <Card
                              key={actor.id}
                              className="flex-shrink-0 w-40 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
                            >
                              {actor.profile_path ? (
                                <img
                                  src={getImageUrl(actor.profile_path, "w342")}
                                  alt={actor.name}
                                  className="w-full aspect-[2/3] object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "/placeholder.jpg";
                                  }}
                                />
                              ) : (
                                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                                  <Users className="h-12 w-12 text-muted-foreground" />
                                </div>
                              )}
                              <div className="p-3">
                                <p className="font-semibold text-sm line-clamp-1 text-foreground">
                                  {actor.name}
                                </p>
                                {actor.character && (
                                  <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                    {actor.character}
                                  </p>
                                )}
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {crew.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold mb-6 text-foreground">
                        Crew
                      </h3>
                      <div
                        className="overflow-x-auto scrollbar-hide"
                        style={{ scrollBehavior: "smooth" }}
                      >
                        <div className="flex gap-4 pb-4">
                          {crew.map((member) => (
                            <Card
                              key={`${member.id}-${member.job}`}
                              className="flex-shrink-0 min-w-[200px] p-4 shadow-md hover:shadow-lg transition-shadow"
                            >
                              <div className="flex items-center gap-3">
                                {member.profile_path ? (
                                  <img
                                    src={getImageUrl(
                                      member.profile_path,
                                      "w185"
                                    )}
                                    alt={member.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "/placeholder.jpg";
                                    }}
                                  />
                                ) : (
                                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                    <Users className="h-8 w-8 text-muted-foreground" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-semibold text-foreground">
                                    {member.name}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {member.job}
                                  </p>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {videos.length > 0 && (
              <TabsContent value="videos" className="mt-6">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-foreground">
                  <Video className="h-5 w-5" />
                  Videos & Trailers
                </h3>
                <div
                  className="overflow-x-auto scrollbar-hide"
                  style={{ scrollBehavior: "smooth" }}
                >
                  <div className="flex gap-4 pb-4">
                    {videos.map((video) => (
                      <Card
                        key={video.id}
                        className="flex-shrink-0 w-80 overflow-hidden shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className="aspect-video bg-muted relative">
                          {video.site === "YouTube" ? (
                            <img
                              src={`https://img.youtube.com/vi/${video.key}/maxresdefault.jpg`}
                              alt={video.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (
                                  e.target as HTMLImageElement
                                ).src = `https://img.youtube.com/vi/${video.key}/hqdefault.jpg`;
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="h-12 w-12 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors">
                            <div className="rounded-full bg-primary/90 p-4">
                              <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
                            </div>
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="font-semibold text-foreground">
                            {video.name}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {video.type}
                          </p>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>

        {episodes.length > 0 && (
          <div className="mt-12">
            <EpisodeList episodes={episodes} donghuaId={id!} />
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="mt-12">
            <RecommendationGrid
              items={recommendations}
              title="Recommendations"
            />
          </div>
        )}
      </div>

      {/* Video Dialog */}
      {selectedVideo && (
        <Dialog
          open={!!selectedVideo}
          onOpenChange={(open) => !open && setSelectedVideo(null)}
        >
          <DialogContent className="max-w-5xl w-full p-0">
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="text-xl">
                {selectedVideo.name}
              </DialogTitle>
              <DialogClose onClose={() => setSelectedVideo(null)} />
            </DialogHeader>
            <div className="p-6 pt-4">
              <div className="aspect-video bg-muted relative rounded-lg overflow-hidden">
                {selectedVideo.site === "YouTube" ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${selectedVideo.key}?autoplay=1`}
                    title={selectedVideo.name}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                {selectedVideo.type}
              </p>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Poster Dialog */}
      {selectedPoster && (
        <Dialog
          open={!!selectedPoster}
          onOpenChange={(open) => !open && setSelectedPoster(null)}
        >
          <DialogContent className="max-w-4xl w-full p-0 border-0 shadow-none bg-transparent">
            <div className="relative p-6">
              <button
                onClick={() => setSelectedPoster(null)}
                className="absolute right-7 top-7 z-10 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm p-2 transition-colors"
              >
                <X className="h-5 w-5 text-white" />
                <span className="sr-only">Close</span>
              </button>
              <img
                src={getImageUrl(selectedPoster, "original")}
                alt={`${donghua.title} poster`}
                className="w-full h-auto max-h-[80vh] object-contain mx-auto rounded-xl drop-shadow-2xl"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.jpg";
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
