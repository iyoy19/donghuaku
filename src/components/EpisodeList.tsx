import { Link, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Play } from "lucide-react"
import { Episode } from "@/types"
import { Card } from "./ui/card"

interface EpisodeListProps {
  episodes: Episode[]
  donghuaId: string | number
}

export function EpisodeList({ episodes, donghuaId }: EpisodeListProps) {
  const { episode: currentEpisode } = useParams()

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold">Episodes</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {episodes.map((ep, index) => (
          <motion.div
            key={ep.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link to={`/watch/${donghuaId}/${ep.episodeNumber}`}>
              <Card
                className={`overflow-hidden cursor-pointer transition-all hover:scale-105 ${
                  currentEpisode === String(ep.episodeNumber)
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
                      <Play className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play className="h-8 w-8 text-white fill-white" />
                  </div>
                  <div className="absolute top-2 left-2 bg-black/70 rounded px-2 py-1">
                    <span className="text-xs font-medium text-white">
                      EP {ep.episodeNumber}
                    </span>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium line-clamp-2">{ep.title}</p>
                  {ep.duration && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {ep.duration} min
                    </p>
                  )}
                </div>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

