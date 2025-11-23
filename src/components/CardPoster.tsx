import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Star, Play } from "lucide-react"
import { Donghua } from "@/types"
import { getImageUrl } from "@/utils/image"
import { cn } from "@/utils/cn"

interface CardPosterProps {
  item: Donghua
  index?: number
  className?: string
}

export function CardPoster({ item, index = 0, className }: CardPosterProps) {
  // Get status badge based on donghua status
  const getStatusBadge = () => {
    // Only show status for TV series
    if (item.media_type !== 'tv') {
      return null
    }

    const status = item.status

    // If status is ongoing - show ongoing badge on top left
    if (status === 'ongoing') {
      return (
        <div className="absolute top-2 left-2 bg-blue-500/90 backdrop-blur-sm rounded px-2 py-1 z-10">
          <span className="text-xs font-medium text-white">Ongoing</span>
        </div>
      )
    }

    // If status is completed - show completed badge on top left
    if (status === 'completed') {
      return (
        <div className="absolute top-2 left-2 bg-green-500/90 backdrop-blur-sm rounded px-2 py-1 z-10">
          <span className="text-xs font-medium text-white">Completed</span>
        </div>
      )
    }

    // If status is upcoming
    if (status === 'upcoming') {
      return (
        <div className="absolute top-2 left-2 bg-yellow-500/90 backdrop-blur-sm rounded px-2 py-1 z-10">
          <span className="text-xs font-medium text-white">Upcoming</span>
        </div>
      )
    }

    return null
  }

  // Get latest episode number for ongoing series (bottom right)
  const getLatestEpisodeBadge = () => {
    if (item.media_type !== 'tv' || item.status !== 'ongoing') {
      return null
    }

    const releasedEpisodes = item.released_episodes_count || 0

    // Only show latest episode count for ongoing series
    if (releasedEpisodes > 0) {
      return (
        <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm rounded px-2 py-1 z-10">
          <span className="text-xs font-medium text-white">
            EP {releasedEpisodes}
          </span>
        </div>
      )
    }

    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn("group relative", className)}
    >
      <Link to={`/detail/${item.id}`}>
        <div className="relative overflow-hidden rounded-lg aspect-[2/3] bg-muted">
          <img
            src={getImageUrl(item.poster_path, 'original')}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="rounded-full bg-primary/90 p-4">
              <Play className="h-8 w-8 text-primary-foreground fill-primary-foreground" />
            </div>
          </div>
          <div className="absolute top-2 right-2 flex items-center space-x-1 bg-black/70 rounded px-2 py-1">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-medium text-white">
              {item.vote_average.toFixed(1)}
            </span>
          </div>
          {getStatusBadge()}
          {getLatestEpisodeBadge()}
        </div>
        <div className="mt-2">
          <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          {item.chineseTitle && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {item.chineseTitle}
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

