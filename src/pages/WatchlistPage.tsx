import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { motion } from "framer-motion"
import { Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CardPoster } from "@/components/CardPoster"
import { Donghua } from "@/types"

export function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<Donghua[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load watchlist from localStorage
    const loadWatchlist = async () => {
      try {
        const savedWatchlist = localStorage.getItem("watchlist")
        if (savedWatchlist) {
          const ids = JSON.parse(savedWatchlist) as number[]
          if (ids.length > 0) {
            // Fetch donghua details for each ID
            const { api } = await import("@/services/api")
            const allDonghua = await api.getAllDonghua()
            const watchlistItems = allDonghua
              .filter((d: any) => ids.includes(d.id))
              .map((donghua: any) => ({
                id: donghua.id,
                title: donghua.title,
                chineseTitle: donghua.chineseTitle,
                overview: donghua.overview,
                poster_path: donghua.posterPath,
                backdrop_path: donghua.backdropPath,
                posters: donghua.posters || [],
                release_date: donghua.releaseDate ? new Date(donghua.releaseDate).toISOString().split('T')[0] : undefined,
                first_air_date: donghua.firstAirDate ? new Date(donghua.firstAirDate).toISOString().split('T')[0] : undefined,
                vote_average: donghua.voteAverage,
                vote_count: donghua.voteCount,
                genre_ids: donghua.genreIds,
                genres: donghua.genres,
                status: donghua.status,
                episode_count: donghua.episodeCount,
                media_type: donghua.mediaType as 'movie' | 'tv',
                released_episodes_count: donghua.episodes ? donghua.episodes.length : 0,
              }))
            setWatchlist(watchlistItems)
          }
        }
      } catch (error) {
        console.error("Error loading watchlist:", error)
      } finally {
        setLoading(false)
      }
    }

    loadWatchlist()
  }, [])

  const removeFromWatchlist = (id: number) => {
    const savedWatchlist = localStorage.getItem("watchlist")
    if (savedWatchlist) {
      const ids = JSON.parse(savedWatchlist) as number[]
      const updatedIds = ids.filter(itemId => itemId !== id)
      localStorage.setItem("watchlist", JSON.stringify(updatedIds))
      setWatchlist(prev => prev.filter(item => item.id !== id))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Watchlist</h1>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : watchlist.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {watchlist.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="relative group"
              >
                <CardPoster item={item} index={index} />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeFromWatchlist(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Your watchlist is empty</p>
            <Link to="/">
              <Button>Browse Donghua</Button>
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  )
}

