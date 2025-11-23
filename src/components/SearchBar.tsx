import { useState, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { api } from "@/services/api"
import { getImageUrl } from "@/utils/image"
import { Donghua } from "@/types"

export function SearchBar() {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<Donghua[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchTimer = setTimeout(async () => {
      setLoading(true)
      try {
        const searchResults = await api.searchDonghua({ q: query })
        
        // Transform database data to match Donghua type
        const transformedResults: Donghua[] = searchResults.slice(0, 6).map((donghua: any) => ({
          id: donghua.id,
          title: donghua.title,
          chineseTitle: donghua.chineseTitle,
          overview: donghua.overview,
          poster_path: donghua.posterPath,
          backdrop_path: donghua.backdropPath,
          release_date: donghua.releaseDate ? new Date(donghua.releaseDate).toISOString().split('T')[0] : undefined,
          first_air_date: donghua.firstAirDate ? new Date(donghua.firstAirDate).toISOString().split('T')[0] : undefined,
          vote_average: donghua.voteAverage,
          vote_count: donghua.voteCount,
          genre_ids: donghua.genreIds,
          genres: donghua.genres,
          status: donghua.status,
          episode_count: donghua.episodeCount,
          media_type: donghua.mediaType as 'movie' | 'tv',
        }))
        
        setResults(transformedResults)
        setIsOpen(true)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [query])

  const handleSelect = (item: Donghua) => {
    navigate(`/detail/${item.id}`)
    setQuery("")
    setIsOpen(false)
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search donghua..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setIsOpen(true)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => {
              setQuery("")
              setIsOpen(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full rounded-lg border bg-popover shadow-lg z-50 max-h-[400px] overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : (
              <div className="p-2">
                {results.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
                  >
                    <img
                      src={getImageUrl(item.poster_path, "w92")}
                      alt={item.title}
                      className="w-12 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      {item.chineseTitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {item.chineseTitle}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

