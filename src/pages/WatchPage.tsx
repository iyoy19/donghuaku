import { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { VideoPlayer } from "@/components/VideoPlayer"
import { api } from "@/services/api"
import { Episode } from "@/types"

export function WatchPage() {
  const { id, episode } = useParams<{ id: string; episode: string }>()
  const navigate = useNavigate()
  const [episodes, setEpisodes] = useState<Episode[]>([])
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const fetchEpisodes = async () => {
      if (!id) return
      try {
        const donghuaId = parseInt(id)
        const episodesData = await api.getEpisodesByDonghuaId(donghuaId)
        
        // Transform episodes
        const transformedEpisodes: Episode[] = episodesData.map((ep: any) => ({
          id: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          thumbnail: ep.thumbnail,
          duration: ep.duration,
          servers: ep.servers || [],
          subtitles: ep.subtitles || [],
          airDate: ep.airDate ? new Date(ep.airDate).toISOString().split('T')[0] : undefined,
        }))
        
        setEpisodes(transformedEpisodes)

        const epNum = parseInt(episode || "1")
        const index = transformedEpisodes.findIndex((ep) => ep.episodeNumber === epNum)
        if (index !== -1) {
          setCurrentIndex(index)
          setCurrentEpisode(transformedEpisodes[index])
        } else if (transformedEpisodes.length > 0) {
          setCurrentEpisode(transformedEpisodes[0])
          setCurrentIndex(0)
        }
      } catch (error) {
        console.error("Error fetching episodes:", error)
      }
    }

    fetchEpisodes()
  }, [id, episode])

  const handleNextEpisode = () => {
    if (currentIndex < episodes.length - 1) {
      const nextIndex = currentIndex + 1
      setCurrentIndex(nextIndex)
      setCurrentEpisode(episodes[nextIndex])
      navigate(`/watch/${id}/${episodes[nextIndex].episodeNumber}`, {
        replace: true,
      })
    }
  }

  const handlePrevEpisode = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1
      setCurrentIndex(prevIndex)
      setCurrentEpisode(episodes[prevIndex])
      navigate(`/watch/${id}/${episodes[prevIndex].episodeNumber}`, {
        replace: true,
      })
    }
  }

  if (!currentEpisode) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Episode not found</p>
        <Link to={`/detail/${id}`}>
          <Button className="mt-4">Back to Detail</Button>
        </Link>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-background"
    >
      <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <Link to={`/detail/${id}`} className="w-full sm:w-auto">
              <Button variant="ghost" className="gap-2 w-full sm:w-auto">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to Detail</span>
                <span className="sm:hidden">Back</span>
              </Button>
            </Link>
            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevEpisode}
                disabled={currentIndex === 0}
                className="flex-1 sm:flex-none"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Prev</span>
              </Button>
              <span className="text-xs sm:text-sm font-medium px-2 sm:px-4 text-center">
                EP {currentEpisode.episodeNumber} / {episodes.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextEpisode}
                disabled={currentIndex === episodes.length - 1}
                className="flex-1 sm:flex-none"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">{currentEpisode.title}</h1>
          {currentEpisode.duration && (
            <p className="text-muted-foreground">
              Duration: {currentEpisode.duration} minutes
            </p>
          )}
        </div>

        <VideoPlayer
          episode={currentEpisode}
          donghuaId={id!}
          onNextEpisode={handleNextEpisode}
          onPrevEpisode={handlePrevEpisode}
          hasNext={currentIndex < episodes.length - 1}
          hasPrev={currentIndex > 0}
        />

        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">All Episodes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {episodes.map((ep) => (
              <Link key={ep.id} to={`/watch/${id}/${ep.episodeNumber}`}>
                <Card
                  className={`overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                    ep.episodeNumber === currentEpisode.episodeNumber
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                >
                  <div className="relative aspect-video bg-muted">
                    {ep.thumbnail ? (
                      <img
                        src={ep.thumbnail}
                        alt={ep.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-muted-foreground">
                          EP {ep.episodeNumber}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium line-clamp-2">
                      {ep.title}
                    </p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

