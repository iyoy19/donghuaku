import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Play, Heart, Star, Calendar } from "lucide-react"
import { Button } from "./ui/button"
import { Donghua } from "@/types"
import { getImageUrl } from "@/utils/image"

interface HeroBannerProps {
  items: Donghua[]
}

export function HeroBanner({ items }: HeroBannerProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const currentItem = items[currentIndex]

  useEffect(() => {
    if (items.length === 0) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [items.length])

  if (!currentItem) return null

  return (
    <div className="relative h-[600px] md:h-[700px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: `url(${getImageUrl(currentItem.backdrop_path, "original")})`,
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl space-y-4"
        >
          <div className="flex items-center space-x-4 text-sm">
            {currentItem.genres?.slice(0, 3).map((genre) => (
              <span
                key={genre.id}
                className="px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30"
              >
                {genre.name}
              </span>
            ))}
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-white">
            {currentItem.title}
          </h1>

          {currentItem.chineseTitle && (
            <h2 className="text-2xl md:text-3xl text-gray-300">
              {currentItem.chineseTitle}
            </h2>
          )}

          <div className="flex items-center space-x-6 text-sm text-gray-300">
            <div className="flex items-center space-x-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span>{currentItem.vote_average.toFixed(1)}</span>
            </div>
            {(currentItem.release_date || currentItem.first_air_date) && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(
                    currentItem.release_date || currentItem.first_air_date || ""
                  ).getFullYear()}
                </span>
              </div>
            )}
            {currentItem.episode_count && (
              <span>{currentItem.episode_count} Episodes</span>
            )}
          </div>

          <p className="text-gray-300 line-clamp-3">{currentItem.overview}</p>

          <div className="flex items-center space-x-4">
            <Link to={`/detail/${currentItem.id}`}>
              <Button size="lg" className="gap-2">
                <Play className="h-5 w-5" />
                Watch Now
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="gap-2">
              <Heart className="h-5 w-5" />
              Add to Favorites
            </Button>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
        {items.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-primary" : "w-2 bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

