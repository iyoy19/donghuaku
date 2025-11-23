import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Maximize,
  Minimize,
  SkipForward,
  X,
  PictureInPicture,
} from "lucide-react";
import { Button } from "./ui/button";
import { VideoServerSwitcher } from "./VideoServerSwitcher";
import { Skeleton } from "./ui/skeleton";
import { tmdb } from "@/services/tmdb";

interface VideoPlayerProps {
  episode: any;
  onPrevEpisode?: () => void;
  onNextEpisode?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
  tmdbId?: number;
  seasonNumber?: number;
  tmdbEpisodeData?: any;
  donghuaId?: string;
}

export function VideoPlayer({
  episode,
  onPrevEpisode,
  hasPrev = false,
  tmdbId,
  seasonNumber,
  tmdbEpisodeData,
}: VideoPlayerProps) {
  const [currentServerIndex, setCurrentServerIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [lightOff, setLightOff] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [tmdbVideos, setTmdbVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  const currentServer = episode.servers[currentServerIndex];
  const currentTmdbVideo = tmdbVideos[currentVideoIndex];
  // Determine which source to use: prioritize TMDB videos if available, then fallback to servers
  const isTmdbVideo =
    tmdbVideos.length > 0 && currentVideoIndex < tmdbVideos.length;

  // Fetch TMDB episode videos if tmdbId and seasonNumber are provided
  useEffect(() => {
    const fetchTmdbVideos = async () => {
      if (tmdbId && seasonNumber && episode.episodeNumber) {
        try {
          if (tmdbEpisodeData?.videos) {
            setTmdbVideos(tmdbEpisodeData.videos.results || []);
          } else {
            const episodeData = await tmdb.getEpisodeFull(
              tmdbId,
              seasonNumber,
              episode.episodeNumber
            );
            setTmdbVideos(episodeData.videos?.results || []);
          }
        } catch (error) {
          console.error("Error fetching TMDB videos:", error);
        }
      }
    };
    fetchTmdbVideos();
  }, [tmdbId, seasonNumber, episode.episodeNumber, tmdbEpisodeData]);

  useEffect(() => {
    setLoading(true);
    setError(false);
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [currentServerIndex, episode.id]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === " ") {
        e.preventDefault();
      } else if (e.key === "f" || e.key === "F") {
        setIsTheater(!isTheater);
      } else if (e.key === "p" || e.key === "P") {
        // Commented out PiP toggle because requestPictureInPicture not supported on iframe
        // togglePiP()
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isTheater]);

  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const handleServerError = () => {
    setError(true);
    if (currentServerIndex < episode.servers.length - 1) {
      setTimeout(() => {
        setCurrentServerIndex(currentServerIndex + 1);
      }, 2000);
    }
  };

  /* Disabled togglePiP because iframe element does not support requestPictureInPicture()
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        if (iframeRef.current) {
          await iframeRef.current.requestPictureInPicture()
          setIsPiP(true)
        }
      }
    } catch (error) {
      console.error("PiP error:", error)
    }
  }
  */

  const getVideoUrl = (video: any) => {
    if (!video) return null;
    if (video.site === "YouTube") {
      return `https://www.youtube.com/embed/${video.key}?autoplay=1&rel=0`;
    }
    if (video.site === "Vimeo") {
      return `https://player.vimeo.com/video/${video.key}?autoplay=1`;
    }
    return null;
  };

  const handleVideoError = () => {
    setError(true);
    if (currentVideoIndex < tmdbVideos.length - 1) {
      setTimeout(() => {
        setCurrentVideoIndex(currentVideoIndex + 1);
      }, 2000);
    } else if (currentServerIndex < episode.servers.length - 1) {
      setTimeout(() => {
        setCurrentServerIndex(currentServerIndex + 1);
      }, 2000);
    }
  };

  return (
    <div
      className={`relative bg-black ${
        isTheater ? "h-screen" : "aspect-video"
      } ${lightOff ? "cursor-none" : ""}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(false)}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
      )}

      <AnimatePresence>
        {error && currentServerIndex < episode.servers.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/80 z-50"
          >
            <div className="text-center text-white">
              <p>Server failed, switching to next server...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isTmdbVideo && currentTmdbVideo ? (
        <iframe
          ref={iframeRef}
          src={getVideoUrl(currentTmdbVideo) || ""}
          className="w-full h-full"
          allowFullScreen
          allow="autoplay; encrypted-media"
          onLoad={() => setLoading(false)}
          onError={handleVideoError}
          title={`Episode ${episode.episodeNumber} - ${currentTmdbVideo.name}`}
        />
      ) : currentServer ? (
        <iframe
          ref={iframeRef}
          src={currentServer.url}
          className="w-full h-full"
          allowFullScreen
          onLoad={() => setLoading(false)}
          onError={handleServerError}
          title={`Episode ${episode.episodeNumber}`}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <p className="text-lg font-semibold mb-2">
              No video source available
            </p>
            <p className="text-sm text-gray-400">
              Please add video servers or TMDB video data
            </p>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showControls && !lightOff && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none"
          >
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-4">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onPrevEpisode}
                    disabled={!hasPrev}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-5 w-5 rotate-180" />
                  </Button>
                  <span className="text-sm font-medium">
                    Episode {episode.episodeNumber}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    // onClick={togglePiP}
                    className="text-white hover:bg-white/20"
                  >
                    <PictureInPicture className="h-5 w-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsTheater(!isTheater)}
                    className="text-white hover:bg-white/20"
                  >
                    {isTheater ? (
                      <Minimize className="h-5 w-5" />
                    ) : (
                      <Maximize className="h-5 w-5" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLightOff(!lightOff)}
                    className="text-white hover:bg-white/20"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-4 right-4 z-50">
        {(episode.servers.length > 0 || tmdbVideos.length > 0) && (
          <VideoServerSwitcher
            servers={[
              ...(tmdbVideos.length > 0
                ? tmdbVideos.map((v, idx) => ({
                    name: v.name || `TMDB Video ${idx + 1}`,
                    url: getVideoUrl(v) || "",
                  }))
                : []),
              ...episode.servers,
            ]}
            currentIndex={
              isTmdbVideo
                ? currentVideoIndex
                : currentServerIndex + tmdbVideos.length
            }
            onServerChange={(index) => {
              if (index < tmdbVideos.length) {
                setCurrentVideoIndex(index);
                setCurrentServerIndex(0);
              } else {
                setCurrentServerIndex(index - tmdbVideos.length);
                setCurrentVideoIndex(
                  tmdbVideos.length > 0 ? tmdbVideos.length - 1 : 0
                );
              }
              setError(false);
            }}
          />
        )}
      </div>
    </div>
  );
}
