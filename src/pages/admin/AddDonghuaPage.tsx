import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Loader2, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { api } from "@/services/api"
import { getImageUrl } from "@/utils/image"
import { AdminDonghua } from "@/types"

export function AddDonghuaPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<Partial<AdminDonghua & { release_date?: string; first_air_date?: string; vote_average?: number; vote_count?: number; episode_count?: number }>>({
    title: "",
    chineseTitle: "",
    tmdbId: undefined,
    poster_path: "",
    backdrop_path: "",
    posters: [],
    overview: "",
    synopsis: "",
    status: "ongoing",
    genres: [],
    release_date: undefined,
    first_air_date: undefined,
    vote_average: 0,
    vote_count: 0,
    episode_count: 0,
  })
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  // Handle click outside search results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Search TMDB when query changes
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }

    const searchTimer = setTimeout(async () => {
      setSearching(true)
      try {
        const data = await api.searchTMDB(searchQuery, mediaType)
        const results = data.results || []
        setSearchResults(results)
        setShowSearchResults(true)
      } catch (err) {
        console.error('Error searching TMDB:', err)
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(searchTimer)
  }, [searchQuery, mediaType])

  // Fetch data from TMDB when tmdbId changes
  useEffect(() => {
    const fetchTMDBData = async () => {
      if (!formData.tmdbId || formData.tmdbId <= 0) return

      setFetching(true)
      setError(null)
      try {
        const { tmdb } = await import("@/services/tmdb")
        const [tmdbData, imagesData] = await Promise.all([
          api.getTMDBData(mediaType, formData.tmdbId),
          mediaType === 'movie' 
            ? tmdb.getMovieImages(formData.tmdbId)
            : tmdb.getTVImages(formData.tmdbId)
        ])
        
        // Get multiple posters
        const posters = imagesData.posters?.map((p: any) => p.file_path) || []
        if (tmdbData.poster_path && !posters.includes(tmdbData.poster_path)) {
          posters.unshift(tmdbData.poster_path)
        }
        
        // Auto-fill form with TMDB data
        setFormData(prev => ({
          ...prev,
          title: tmdbData.title || tmdbData.name || prev.title,
          overview: tmdbData.overview || prev.overview,
          poster_path: tmdbData.poster_path ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}` : prev.poster_path,
          backdrop_path: tmdbData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${tmdbData.backdrop_path}` : prev.backdrop_path,
          posters: posters,
          genres: tmdbData.genres || [],
          vote_average: tmdbData.vote_average || 0,
          vote_count: tmdbData.vote_count || 0,
          episode_count: mediaType === 'tv' ? (tmdbData.number_of_episodes || 0) : undefined,
          release_date: mediaType === 'movie' && tmdbData.release_date ? tmdbData.release_date : undefined,
          first_air_date: mediaType === 'tv' && tmdbData.first_air_date ? tmdbData.first_air_date : undefined,
        }))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch from TMDB')
        console.error('Error fetching TMDB data:', err)
      } finally {
        setFetching(false)
      }
    }

    fetchTMDBData()
  }, [formData.tmdbId, mediaType])

  const handleSelectSearchResult = async (result: any) => {
    const resultType = (result.media_type || mediaType) as 'movie' | 'tv'
    setMediaType(resultType)
    
    // Fetch full details from TMDB to get complete data including genres
    try {
      setFetching(true)
      const fullData = await api.getTMDBData(resultType, result.id)
      
      // Fetch images to get multiple posters
      let posters: string[] = []
      try {
        const { tmdb } = await import("@/services/tmdb")
        const imagesData = resultType === 'movie' 
          ? await tmdb.getMovieImages(result.id)
          : await tmdb.getTVImages(result.id)
        posters = imagesData.posters?.map((p: any) => p.file_path) || []
        if (fullData.poster_path && !posters.includes(fullData.poster_path)) {
          posters.unshift(fullData.poster_path)
        }
      } catch (err) {
        console.error('Error fetching images:', err)
        if (fullData.poster_path) {
          posters = [fullData.poster_path]
        }
      }
      
      setFormData({
        title: fullData.title || fullData.name || result.title || result.name || "",
        chineseTitle: "",
        tmdbId: result.id,
        poster_path: fullData.poster_path ? `https://image.tmdb.org/t/p/w500${fullData.poster_path}` : "",
        backdrop_path: fullData.backdrop_path ? `https://image.tmdb.org/t/p/w1280${fullData.backdrop_path}` : "",
        posters: posters,
        overview: fullData.overview || "",
        synopsis: "",
        status: "ongoing",
        genres: fullData.genres || [],
        vote_average: fullData.vote_average || 0,
        vote_count: fullData.vote_count || 0,
        episode_count: resultType === 'tv' ? (fullData.number_of_episodes || 0) : undefined,
        release_date: resultType === 'movie' && fullData.release_date ? fullData.release_date : undefined,
        first_air_date: resultType === 'tv' && fullData.first_air_date ? fullData.first_air_date : undefined,
      })
    } catch (err) {
      // Fallback to result data if full fetch fails
      setFormData({
        title: result.title || result.name || "",
        chineseTitle: "",
        tmdbId: result.id,
        poster_path: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : "",
        backdrop_path: result.backdrop_path ? `https://image.tmdb.org/t/p/w1280${result.backdrop_path}` : "",
        posters: result.poster_path ? [result.poster_path] : [],
        overview: result.overview || "",
        synopsis: "",
        status: "ongoing",
        genres: result.genre_ids || [],
        vote_average: result.vote_average || 0,
        vote_count: result.vote_count || 0,
        release_date: result.release_date,
        first_air_date: result.first_air_date,
      })
    } finally {
      setFetching(false)
    }
    
    setSearchQuery("")
    setShowSearchResults(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.tmdbId) {
      setError('TMDB ID is required')
      return
    }

    setLoading(true)
    setError(null)
    try {
      await api.syncFromTMDB({
        tmdbId: formData.tmdbId!,
        type: mediaType,
        status: formData.status,
        chineseTitle: formData.chineseTitle,
        synopsis: formData.synopsis,
        voteAverage: formData.vote_average,
        voteCount: formData.vote_count,
        episodeCount: formData.episode_count,
        releaseDate: formData.release_date,
        firstAirDate: formData.first_air_date,
      })
      navigate("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add donghua')
      console.error('Error adding donghua:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/admin">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add Donghua</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Donghua Information</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Search Section */}
              <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                <label className="text-sm font-medium mb-2 block">
                  Search by Title / Name
                </label>
                <div ref={searchRef} className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                      placeholder={`Search ${mediaType === 'tv' ? 'TV Series' : 'Movies'} by title...`}
                      className="pl-10 pr-10"
                    />
                    {searchQuery && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                        onClick={() => {
                          setSearchQuery("")
                          setSearchResults([])
                          setShowSearchResults(false)
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {searching && (
                      <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  <AnimatePresence>
                    {showSearchResults && searchResults.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full mt-2 w-full rounded-lg border bg-popover shadow-lg z-50 max-h-[400px] overflow-y-auto"
                      >
                        <div className="p-2">
                          {searchResults.map((result) => (
                            <div
                              key={result.id}
                              onClick={() => handleSelectSearchResult(result)}
                              className="flex items-center space-x-3 p-3 rounded-md hover:bg-accent cursor-pointer transition-colors"
                            >
                              <img
                                src={getImageUrl(result.poster_path, "w92")}
                                alt={result.title || result.name}
                                className="w-12 h-16 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/placeholder.jpg'
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">
                                  {result.title || result.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {result.media_type === 'movie' ? 'Movie' : 'TV Series'} • {result.release_date || result.first_air_date ? new Date(result.release_date || result.first_air_date).getFullYear() : 'N/A'}
                                </p>
                                {result.overview && (
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                    {result.overview}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Search for movies or TV series by title. Click on a result to auto-fill the form.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Media Type *
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={mediaType}
                    onChange={(e) => {
                      setMediaType(e.target.value as 'movie' | 'tv')
                      setFormData({ ...formData, tmdbId: undefined })
                      setSearchQuery("")
                      setSearchResults([])
                    }}
                  >
                    <option value="tv">TV Series</option>
                    <option value="movie">Movie</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    TMDB ID * {fetching && <Loader2 className="inline h-3 w-3 animate-spin ml-2" />}
                  </label>
                  <Input
                    type="number"
                    value={formData.tmdbId || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        tmdbId: parseInt(e.target.value) || undefined,
                      })
                    }
                    required
                    placeholder="Enter TMDB ID or search above"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter TMDB ID manually or search by title above
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Title *
                  </label>
                  <Input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Chinese Title
                  </label>
                  <Input
                    value={formData.chineseTitle}
                    onChange={(e) =>
                      setFormData({ ...formData, chineseTitle: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        status: e.target.value as "ongoing" | "complete" | "upcoming",
                      })
                    }
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="complete">Complete</option>
                    <option value="upcoming">Upcoming</option>
                  </select>
                </div>
                {mediaType === 'tv' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Episode Count
                    </label>
                    <Input
                      type="number"
                      value={formData.episode_count || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          episode_count: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Vote Average
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.vote_average || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vote_average: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Vote Count
                  </label>
                  <Input
                    type="number"
                    value={formData.vote_count || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        vote_count: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                {mediaType === 'movie' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Release Date
                    </label>
                    <Input
                      type="date"
                      value={formData.release_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, release_date: e.target.value })
                      }
                    />
                  </div>
                )}
                {mediaType === 'tv' && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      First Air Date
                    </label>
                    <Input
                      type="date"
                      value={formData.first_air_date || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, first_air_date: e.target.value })
                      }
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Poster URL
                  </label>
                  <Input
                    value={formData.poster_path}
                    onChange={(e) =>
                      setFormData({ ...formData, poster_path: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Backdrop URL
                  </label>
                  <Input
                    value={formData.backdrop_path}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        backdrop_path: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Overview</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.overview}
                  onChange={(e) =>
                    setFormData({ ...formData, overview: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Synopsis</label>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.synopsis}
                  onChange={(e) =>
                    setFormData({ ...formData, synopsis: e.target.value })
                  }
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Link to="/admin">
                  <Button type="button" variant="outline" disabled={loading}>
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={loading || fetching}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Donghua'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}

