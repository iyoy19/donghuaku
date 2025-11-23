import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { motion } from "framer-motion"
import { Search, Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardPoster } from "@/components/CardPoster"
import { SkeletonCard } from "@/components/SkeletonCard"
import { api } from "@/services/api"
import { Donghua, Genre, SearchFilters } from "@/types"

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get("q") || "")
  const [results, setResults] = useState<Donghua[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    year: searchParams.get("year") ? parseInt(searchParams.get("year")!) : undefined,
    rating: searchParams.get("rating") ? parseFloat(searchParams.get("rating")!) : undefined,
    genre: searchParams.get("genre") ? parseInt(searchParams.get("genre")!) : undefined,
    sortBy: (searchParams.get("sort") as SearchFilters["sortBy"]) || "popularity",
  })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        // Get all donghua to extract unique genres
        const allDonghua = await api.getAllDonghua()
        const genreMap = new Map<number, Genre>()
        allDonghua.forEach((donghua: any) => {
          if (donghua.genres) {
            donghua.genres.forEach((genre: any) => {
              if (!genreMap.has(genre.id)) {
                genreMap.set(genre.id, genre)
              }
            })
          }
        })
        setGenres(Array.from(genreMap.values()))
      } catch (error) {
        console.error("Error fetching genres:", error)
      }
    }
    fetchGenres()
  }, [])

  useEffect(() => {
    const performSearch = async () => {
      setLoading(true)
      try {
        let searchResults: any[] = []
        
        if (query) {
          // Search with query
          searchResults = await api.searchDonghua({
            q: query,
            genre: filters.genre,
            status: filters.status,
            sortBy: filters.sortBy,
          })
        } else {
          // Search with filters only
          searchResults = await api.searchDonghua({
            genre: filters.genre,
            status: filters.status,
            sortBy: filters.sortBy,
          })
        }

        // Apply additional filters (year, rating) on client side
        let filteredResults = searchResults
        
        if (filters.year) {
          filteredResults = filteredResults.filter((item: any) => {
            const releaseYear = item.releaseDate 
              ? new Date(item.releaseDate).getFullYear()
              : item.firstAirDate 
              ? new Date(item.firstAirDate).getFullYear()
              : null
            return releaseYear === filters.year
          })
        }

        if (filters.rating) {
          filteredResults = filteredResults.filter((item: any) => 
            item.voteAverage >= filters.rating!
          )
        }

        // Transform database data to match Donghua type
        const transformedResults: Donghua[] = filteredResults.map((donghua: any) => ({
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

        setResults(transformedResults)
      } catch (error) {
        console.error("Search error:", error)
      } finally {
        setLoading(false)
      }
    }

    performSearch()
  }, [query, filters])

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key, String(value))
    } else {
      newParams.delete(key)
    }
    setSearchParams(newParams)
  }

  const clearFilters = () => {
    setFilters({
      sortBy: "popularity",
    })
    setSearchParams({})
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search donghua..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  const newParams = new URLSearchParams(searchParams)
                  if (e.target.value) {
                    newParams.set("q", e.target.value)
                  } else {
                    newParams.delete("q")
                  }
                  setSearchParams(newParams)
                }}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border rounded-lg p-4 space-y-4 bg-card"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Year</label>
                  <Input
                    type="number"
                    placeholder="Year"
                    value={filters.year || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "year",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Min Rating
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    placeholder="Rating"
                    value={filters.rating || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "rating",
                        e.target.value
                          ? parseFloat(e.target.value)
                          : undefined
                      )
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Genre</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.genre || ""}
                    onChange={(e) =>
                      handleFilterChange(
                        "genre",
                        e.target.value ? parseInt(e.target.value) : undefined
                      )
                    }
                  >
                    <option value="">All Genres</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Sort By</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={filters.sortBy || "popularity"}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                  >
                    <option value="popularity">Popularity</option>
                    <option value="latest">Latest</option>
                    <option value="a-z">A-Z</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-6">
            {query ? `Search Results for "${query}"` : "Browse Donghua"}
            {results.length > 0 && (
              <span className="text-muted-foreground text-lg font-normal ml-2">
                ({results.length} results)
              </span>
            )}
          </h2>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(12)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.map((item, index) => (
                <CardPoster key={item.id} item={item} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No results found</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

