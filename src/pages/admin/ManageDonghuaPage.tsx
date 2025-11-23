import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Edit, Trash2, ArrowLeft, Search, Filter, X, Download, Loader2, AlertTriangle, Info, Eye, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api } from "@/services/api"
import { getImageUrl } from "@/utils/image"
import { AdminDonghua, Genre, TMDBDiscoverParams } from "@/types"
import { tmdb } from "@/services/tmdb"

export function ManageDonghuaPage() {
  const navigate = useNavigate()
  const [donghuaList, setDonghuaList] = useState<AdminDonghua[]>([])
  const [filteredList, setFilteredList] = useState<AdminDonghua[]>([])
  const [selectedItem, setSelectedItem] = useState<AdminDonghua | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [genreFilter, setGenreFilter] = useState<number | null>(null)
  const [genres, setGenres] = useState<Genre[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [pageSize, setPageSize] = useState<number>(30)
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  
  // Bulk add states
  const [bulkAddDialogOpen, setBulkAddDialogOpen] = useState(false)
  const [bulkAddType, setBulkAddType] = useState<'donghua-china' | 'donghua-movie-china' | 'by-genre' | 'discover'>('donghua-china')
  const [selectedGenreId, setSelectedGenreId] = useState<number | null>(null)
  const [bulkAddLoading, setBulkAddLoading] = useState(false)
  const [bulkAddProgress, setBulkAddProgress] = useState({ current: 0, total: 0, message: '' })
  
  // Advanced bulk add states
  const [maxPages, setMaxPages] = useState<number>(5)
  const [defaultStatus, setDefaultStatus] = useState<'ongoing' | 'complete' | 'upcoming'>('ongoing')
  const [skipExisting, setSkipExisting] = useState<boolean>(true)
  const [itemLimit, setItemLimit] = useState<'100' | '300' | 'all'>('100')
  const [previewResults, setPreviewResults] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [discoverParams, setDiscoverParams] = useState<TMDBDiscoverParams>({
    sort_by: 'popularity.desc',
    include_adult: false,
    with_genres: '16', // Animation
    with_original_language: 'zh', // Chinese
    with_origin_country: 'CN', // China
  })
  const [mediaType, setMediaType] = useState<'movie' | 'tv'>('tv')
  const [activeTab, setActiveTab] = useState<string>('source')
  const [tmdbGenres, setTmdbGenres] = useState<Genre[]>([])
  const [loadingTmdbGenres, setLoadingTmdbGenres] = useState(false)
  const [selectedGenres, setSelectedGenres] = useState<number[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  
  // Selection dialog states
  const [showSelectionDialog, setShowSelectionDialog] = useState(false)
  const [selectionResults, setSelectionResults] = useState<any[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set())
  const [selectionLoading] = useState(false)

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allDonghua, allGenres] = await Promise.all([
        api.getAllDonghua(),
        api.getAllDonghua().then(donghuas => {
          const genreMap = new Map<number, Genre>()
          donghuas.forEach((donghua: any) => {
            if (donghua.genres) {
              donghua.genres.forEach((genre: any) => {
                if (!genreMap.has(genre.id)) {
                  genreMap.set(genre.id, genre)
                }
              })
            }
          })
          return Array.from(genreMap.values())
        })
      ])
      
      // Transform database data to match AdminDonghua type
      const transformedDonghua: AdminDonghua[] = allDonghua.map((donghua: any) => ({
        id: donghua.id,
        tmdbId: donghua.tmdbId || 0,
        title: donghua.title,
        chineseTitle: donghua.chineseTitle,
        overview: donghua.overview,
        synopsis: donghua.synopsis || '',
        poster_path: donghua.posterPath,
        backdrop_path: donghua.backdropPath,
        posters: donghua.posters || [],
        release_date: donghua.releaseDate ? new Date(donghua.releaseDate).toISOString().split('T')[0] : undefined,
        first_air_date: donghua.firstAirDate ? new Date(donghua.firstAirDate).toISOString().split('T')[0] : undefined,
        vote_average: donghua.voteAverage,
        vote_count: donghua.voteCount,
        genre_ids: donghua.genreIds,
        genres: donghua.genres,
        status: (donghua.status === 'complete' || donghua.status === 'completed' 
          ? 'complete' 
          : donghua.status === 'upcoming' 
          ? 'upcoming' 
          : 'ongoing') as 'ongoing' | 'complete' | 'upcoming',
        episode_count: donghua.episodeCount,
        media_type: donghua.mediaType as 'movie' | 'tv',
      }))
      
      setDonghuaList(transformedDonghua)
      setFilteredList(transformedDonghua)
      setGenres(allGenres)
    } catch (error) {
      console.error("🔴 [MANAGE DEBUG] Error fetching donghua:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Fetch TMDB genres when mediaType changes
  useEffect(() => {
    const fetchTmdbGenres = async () => {
      if (bulkAddType === 'discover') {
        setLoadingTmdbGenres(true)
        try {
          const data = await tmdb.getGenres(mediaType)
          setTmdbGenres(data.genres || [])
        } catch (error) {
          console.error('Error fetching TMDB genres:', error)
        } finally {
          setLoadingTmdbGenres(false)
        }
      } else {
        // Reset when not in discover mode
        setSelectedGenres([])
        setTmdbGenres([])
      }
    }
    fetchTmdbGenres()
  }, [mediaType, bulkAddType])

  // Reset selected genres when media type changes
  useEffect(() => {
    if (bulkAddType === 'discover') {
      setSelectedGenres([])
      setDiscoverParams(prev => {
        const newParams = { ...prev }
        delete newParams.with_genres
        return newParams
      })
    }
  }, [mediaType])

  // Update discoverParams when selectedGenres changes
  useEffect(() => {
    if (bulkAddType === 'discover') {
      if (selectedGenres.length > 0) {
        setDiscoverParams(prev => ({ ...prev, with_genres: selectedGenres.join(',') }))
      } else {
        setDiscoverParams(prev => {
          const newParams = { ...prev }
          delete newParams.with_genres
          return newParams
        })
      }
    }
  }, [selectedGenres, bulkAddType])

  const toggleGenre = (genreId: number) => {
    setSelectedGenres(prev =>
      prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
    )
  }


  // Apply filters
  useEffect(() => {
    let filtered = [...donghuaList]

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.chineseTitle?.toLowerCase().includes(query) ||
        item.overview.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(item => item.status === statusFilter)
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(item => item.media_type === typeFilter)
    }

    // Genre filter
    if (genreFilter) {
      filtered = filtered.filter(item =>
        item.genre_ids?.includes(genreFilter)
      )
    }

    // Category filter (movie/anime by region)
    if (categoryFilter !== "all") {
      filtered = filtered.filter(item => {
        const isChinese = !!item.chineseTitle
        const isMovie = item.media_type === "movie"
        const isTv = item.media_type === "tv"

        switch (categoryFilter) {
          case "movie-west":
            return isMovie && !isChinese
          case "movie-china":
            return isMovie && isChinese
          case "anime-japan":
            return isTv && !isChinese
          case "anime-china":
            return isTv && isChinese
          default:
            return true
        }
      })
    }

    setFilteredList(filtered)
  }, [searchQuery, statusFilter, typeFilter, genreFilter, categoryFilter, donghuaList])

  const handleDelete = async () => {
    if (!selectedItem) return

    setDeleting(true)
    try {
      await api.deleteDonghua(selectedItem.id)
      setDonghuaList(prev => prev.filter(item => item.id !== selectedItem.id))
      setDeleteDialogOpen(false)
      setSelectedItem(null)
    } catch (error) {
      console.error("Error deleting donghua:", error)
      alert("Failed to delete donghua")
    } finally {
      setDeleting(false)
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setStatusFilter("all")
    setTypeFilter("all")
    setGenreFilter(null)
    setCategoryFilter("all")
  }

  const handlePreview = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior to avoid page refresh
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Return early if already loading
    if (previewLoading) {
      console.warn('Preview already loading, ignoring request')
      return
    }
    
    setPreviewLoading(true)
    setPreviewResults([])
    
    try {
      let results: any[] = []
      
      // Helper function to filter donghua/anime china only
      const filterDonghuaOnly = (items: any[], mediaTypeFilter?: 'tv' | 'movie') => {
        return items.filter(item => {
          // Check media type based on bulkAddType
          const expectedMediaType = mediaTypeFilter || (bulkAddType === 'donghua-movie-china' ? 'movie' : 'tv')
          if (item.media_type && item.media_type !== expectedMediaType) return false
          
          // Check for Animation genre (16)
          const hasAnimation = item.genre_ids?.includes(16) || item.genres?.some((g: any) => g.id === 16)
          if (!hasAnimation) return false
          
          // Check for Chinese language (zh)
          const isChinese = item.original_language === 'zh' || item.original_language === 'cn'
          if (!isChinese) return false
          
          // Check for China origin country
          const isFromChina = item.origin_country?.includes('CN') || item.production_countries?.some((c: any) => c.iso_3166_1 === 'CN')
          if (!isFromChina && !item.origin_country) {
            // If no origin_country data, check name/title for Chinese characters
            const hasChineseChars = /[\u4e00-\u9fa5]/.test(item.title || item.name || '')
            if (!hasChineseChars) return false
          }
          
          return true
        })
      }
      
      // Remove duplicates based on tmdbId
      const removeDuplicates = (items: any[]) => {
        const seen = new Set<number>()
        return items.filter(item => {
          const tmdbId = item.id || item.tmdbId
          if (!tmdbId || seen.has(tmdbId)) {
            return false
          }
          seen.add(tmdbId)
          return true
        })
      }
      
      if (bulkAddType === 'discover') {
        // Sanitize discover params before using
        const sanitizedParams: TMDBDiscoverParams = { ...discoverParams }
        
        // Ensure donghua filters are always applied
        if (!sanitizedParams.with_genres || !sanitizedParams.with_genres.includes('16')) {
          sanitizedParams.with_genres = sanitizedParams.with_genres 
            ? `${sanitizedParams.with_genres},16` 
            : '16'
        }
        sanitizedParams.with_original_language = sanitizedParams.with_original_language || 'zh'
        sanitizedParams.with_origin_country = sanitizedParams.with_origin_country || 'CN'
        
        // Sanitize with_keywords parameter if exists
        if (sanitizedParams.with_keywords) {
          try {
            const keywordsArray = sanitizedParams.with_keywords
              .split(',')
              .map(k => k.trim())
              .filter(k => k !== '' && /^\d+$/.test(k) && parseInt(k) > 0)
            
            if (keywordsArray.length === 0) {
              delete sanitizedParams.with_keywords
            } else {
              sanitizedParams.with_keywords = keywordsArray.join(',')
            }
          } catch (err) {
            delete sanitizedParams.with_keywords
          }
        }
        
        // Force TV type for donghua
        const firstPageData = await tmdb.discover('tv', { ...sanitizedParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'tv')
        results = removeDuplicates(results)
      } else if (bulkAddType === 'donghua-china') {
        // Get donghua/anime china TV only: Animation (16) + zh + CN
        const donghuaParams: TMDBDiscoverParams = {
          with_genres: '16', // Animation
          with_original_language: 'zh', // Chinese
          with_origin_country: 'CN', // China
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const firstPageData = await tmdb.discover('tv', { ...donghuaParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'tv')
        results = removeDuplicates(results)
      } else if (bulkAddType === 'donghua-movie-china') {
        // Get donghua movie china only: Animation (16) + zh + CN
        const movieParams: TMDBDiscoverParams = {
          with_genres: '16', // Animation
          with_original_language: 'zh', // Chinese
          with_origin_country: 'CN', // China
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const firstPageData = await tmdb.discover('movie', { ...movieParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'movie')
        results = removeDuplicates(results)
      } else if (bulkAddType === 'by-genre' && selectedGenreId) {
        // Get TV series with selected genre + donghua filters
        const genreParams: TMDBDiscoverParams = {
          with_genres: `16,${selectedGenreId}`, // Animation + selected genre
          with_original_language: 'zh',
          with_origin_country: 'CN',
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const tvData = await tmdb.discoverTV({ ...genreParams, page: 1 })
        results = filterDonghuaOnly(tvData.results || [], 'tv')
        results = removeDuplicates(results)
      }
      
      setPreviewResults(results.slice(0, 20)) // Show first 20 as preview
      setShowPreview(true)
    } catch (error) {
      console.error('Preview error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      // Show error but don't refresh page
      alert('Error loading preview: ' + errorMessage)
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleToggleItem = (itemId: number) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(itemId)) {
        newSet.delete(itemId)
      } else {
        newSet.add(itemId)
      }
      return newSet
    })
  }
  
  const handleSelectAll = () => {
    if (selectedItems.size === selectionResults.length) {
      // Deselect all
      setSelectedItems(new Set())
    } else {
      // Select all
      const allIds = new Set(selectionResults.map(item => item.id))
      setSelectedItems(allIds)
    }
  }
  
  const handleInsertSelected = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior to avoid any form submission or page refresh
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    if (selectedItems.size === 0) {
      alert('Silakan pilih minimal satu item untuk di-import')
      return
    }
    
    const itemsToInsert = selectionResults.filter(item => selectedItems.has(item.id))
    
    setBulkAddLoading(true)
    setBulkAddProgress({ current: 0, total: itemsToInsert.length, message: 'Starting import...' })
    setShowSelectionDialog(false)
    
    try {
      let successCount = 0
      let errorCount = 0
      const existingTmdbIds = new Set(donghuaList.map(d => d.tmdbId).filter(id => id && id > 0))
      
      for (let i = 0; i < itemsToInsert.length; i++) {
        const item = itemsToInsert[i]
        
        // Skip if already exists (shouldn't happen if skipExisting was used, but double check)
        if (existingTmdbIds.has(item.id)) {
          setBulkAddProgress({
            current: i + 1,
            total: itemsToInsert.length,
            message: `Skipping ${item.title || item.name} (already exists)...`
          })
          continue
        }
        
        setBulkAddProgress({
          current: i + 1,
          total: itemsToInsert.length,
          message: `Adding ${item.title || item.name}...`
        })
        
        try {
          successCount++
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error)
          console.error(`🔴 [MANAGE DEBUG] Error adding ${item.title || item.name} (TMDB ID: ${item.id}):`, error)
          console.error('🔴 [MANAGE DEBUG] Full error:', error)
          console.error('🔴 [MANAGE DEBUG] Error message:', errorMessage)
          
          // Check if it's a duplicate error (409)
          if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
            console.warn(`${item.title || item.name} already exists, skipping...`)
            // Don't count as error if it's a duplicate
          } else {
            errorCount++
            // Show error for first few errors
            if (errorCount <= 3) {
              setBulkAddProgress({
                current: i + 1,
                total: itemsToInsert.length,
                message: `Error adding ${item.title || item.name}: ${errorMessage}`
              })
              // Wait a bit to show the error message
              await new Promise(resolve => setTimeout(resolve, 1000))
            }
          }
        }
        
        // Small delay to avoid rate limiting
        if (i < itemsToInsert.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
      const finalMessage = errorCount > 0
        ? `Completed! Success: ${successCount}, Errors: ${errorCount}. ${successCount > 0 ? 'Data berhasil disimpan.' : 'Tidak ada data yang berhasil disimpan. Periksa console untuk detail error.'}`
        : `Completed! Success: ${successCount} items berhasil disimpan ke database.`
      
      setBulkAddProgress({
        current: itemsToInsert.length,
        total: itemsToInsert.length,
        message: finalMessage
      })
      
      // Show alert if there were errors
      if (errorCount > 0 && successCount === 0) {
        setTimeout(() => {
          alert(`Gagal menyimpan semua item ke database.\n\nSuccess: ${successCount}\nErrors: ${errorCount}\n\nPeriksa console browser (F12) untuk detail error.`)
        }, 500)
      }
      
      // Refresh the list after a delay without reloading page
      if (successCount > 0) {
        // Show success message
        setTimeout(() => {
          fetchData().then(() => {
            setBulkAddLoading(false)
          }).catch((error) => {
            console.error('🔴 [MANAGE DEBUG] Error refreshing data:', error)
            setBulkAddLoading(false)
          })
        }, 1500)
      } else {
        setTimeout(() => {
          setBulkAddLoading(false)
        }, 3000)
      }
    } catch (error) {
      console.error("Insert selected error:", error)
      setBulkAddProgress({
        current: 0,
        total: 0,
        message: `Error: ${error instanceof Error ? error.message : "Unknown error"}`
      })
      setTimeout(() => {
        setBulkAddLoading(false)
      }, 2000)
    }
  }

  const handleBulkAdd = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default behavior to avoid page refresh
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    
    // Return early if already processing
    if (bulkAddLoading) {
      console.warn('Bulk add already in progress, ignoring request')
      return
    }
    
    // Validate required fields based on bulkAddType
    if (bulkAddType === 'by-genre' && !selectedGenreId) {
      setErrorMessage('Silakan pilih genre terlebih dahulu')
      setTimeout(() => setErrorMessage(null), 5000)
      return
    }
    
    if (bulkAddType === 'discover') {
      // Validate discover params - at least sort_by should be present
      if (!discoverParams || !discoverParams.sort_by) {
        setErrorMessage('Silakan atur filter discover terlebih dahulu')
        setTimeout(() => setErrorMessage(null), 5000)
        return
      }
    }
    
    setBulkAddLoading(true)
    setBulkAddProgress({ current: 0, total: 0, message: 'Starting...' })
    setErrorMessage(null)
    
    // Helper function to filter donghua/anime china only
    const filterDonghuaOnly = (items: any[], mediaTypeFilter?: 'tv' | 'movie') => {
      return items.filter(item => {
        // Check media type based on bulkAddType
        const expectedMediaType = mediaTypeFilter || (bulkAddType === 'donghua-movie-china' ? 'movie' : 'tv')
        if (item.media_type && item.media_type !== expectedMediaType) return false
        
        // Check for Animation genre (16)
        const hasAnimation = item.genre_ids?.includes(16) || item.genres?.some((g: any) => g.id === 16)
        if (!hasAnimation) return false
        
        // Check for Chinese language (zh)
        const isChinese = item.original_language === 'zh' || item.original_language === 'cn'
        if (!isChinese) return false
        
        // Check for China origin country
        const isFromChina = item.origin_country?.includes('CN') || item.production_countries?.some((c: any) => c.iso_3166_1 === 'CN')
        if (!isFromChina && !item.origin_country) {
          // If no origin_country data, check name/title for Chinese characters
          const hasChineseChars = /[\u4e00-\u9fa5]/.test(item.title || item.name || '')
          if (!hasChineseChars) return false
        }
        
        return true
      })
    }
    
    // Remove duplicates based on tmdbId
    const removeDuplicates = (items: any[]) => {
      const seen = new Set<number>()
      return items.filter(item => {
        const tmdbId = item.id || item.tmdbId
        if (!tmdbId || seen.has(tmdbId)) {
          return false
        }
        seen.add(tmdbId)
        return true
      })
    }

    try {
      let results: any[] = []
      let totalPages = 1

      if (bulkAddType === 'discover') {
        // Sanitize discover params before using
        const sanitizedParams: TMDBDiscoverParams = { ...discoverParams }
        
        // Ensure donghua filters are always applied
        if (!sanitizedParams.with_genres || !sanitizedParams.with_genres.includes('16')) {
          sanitizedParams.with_genres = sanitizedParams.with_genres 
            ? `${sanitizedParams.with_genres},16` 
            : '16'
        }
        sanitizedParams.with_original_language = sanitizedParams.with_original_language || 'zh'
        sanitizedParams.with_origin_country = sanitizedParams.with_origin_country || 'CN'
        
        // Sanitize with_keywords parameter if exists
        if (sanitizedParams.with_keywords) {
          try {
            const keywordsArray = sanitizedParams.with_keywords
              .split(',')
              .map(k => k.trim())
              .filter(k => k !== '' && /^\d+$/.test(k) && parseInt(k) > 0)
            
            if (keywordsArray.length === 0) {
              delete sanitizedParams.with_keywords
            } else {
              sanitizedParams.with_keywords = keywordsArray.join(',')
            }
          } catch (err) {
            delete sanitizedParams.with_keywords
          }
        }
        
        // Force TV type for donghua
        setBulkAddProgress({ current: 0, total: 0, message: 'Fetching donghua/anime china from TMDB...' })
        
        const firstPageData = await tmdb.discover('tv', { ...sanitizedParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'tv')
        results = removeDuplicates(results)
        totalPages = Math.min(firstPageData.total_pages || 1, maxPages)
        
        // Calculate how many pages needed based on itemLimit
        let targetPages = maxPages
        if (itemLimit === '100') {
          targetPages = Math.min(maxPages, Math.ceil(100 / 20)) // ~5 pages for 100 items
        } else if (itemLimit === '300') {
          targetPages = Math.min(maxPages, Math.ceil(300 / 20)) // ~15 pages for 300 items
        } else {
          targetPages = maxPages // All
        }
        
        // Fetch more pages
        for (let page = 2; page <= Math.min(totalPages, targetPages); page++) {
          setBulkAddProgress({ current: results.length, total: 0, message: `Fetching page ${page}/${Math.min(totalPages, targetPages)}...` })
          const pageData = await tmdb.discover('tv', { ...sanitizedParams, page })
          const filteredPageResults = filterDonghuaOnly(pageData.results || [], 'tv')
          results = [...results, ...filteredPageResults]
          results = removeDuplicates(results) // Remove duplicates after each page
          
          // Stop if we have enough items
          if (itemLimit === '100' && results.length >= 100) break
          if (itemLimit === '300' && results.length >= 300) break
        }
        
        // Limit results based on itemLimit
        if (itemLimit === '100') {
          results = results.slice(0, 100)
        } else if (itemLimit === '300') {
          results = results.slice(0, 300)
        }
        // 'all' means keep all results
      } else if (bulkAddType === 'donghua-china') {
        // Get donghua/anime china TV only: Animation (16) + zh + CN
        setBulkAddProgress({ current: 0, total: 0, message: 'Fetching donghua/anime china TV from TMDB...' })
        const donghuaParams: TMDBDiscoverParams = {
          with_genres: '16', // Animation
          with_original_language: 'zh', // Chinese
          with_origin_country: 'CN', // China
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const firstPageData = await tmdb.discover('tv', { ...donghuaParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'tv')
        results = removeDuplicates(results)
        totalPages = Math.min(firstPageData.total_pages || 1, maxPages)
        
        // Calculate how many pages needed based on itemLimit
        let targetPages = maxPages
        if (itemLimit === '100') {
          targetPages = Math.min(maxPages, Math.ceil(100 / 20)) // ~5 pages for 100 items
        } else if (itemLimit === '300') {
          targetPages = Math.min(maxPages, Math.ceil(300 / 20)) // ~15 pages for 300 items
        } else {
          targetPages = maxPages // All
        }
        
        // Fetch more pages
        for (let page = 2; page <= Math.min(totalPages, targetPages); page++) {
          setBulkAddProgress({ current: results.length, total: 0, message: `Fetching page ${page}/${Math.min(totalPages, targetPages)}...` })
          const pageData = await tmdb.discover('tv', { ...donghuaParams, page })
          const filteredPageResults = filterDonghuaOnly(pageData.results || [], 'tv')
          results = [...results, ...filteredPageResults]
          results = removeDuplicates(results) // Remove duplicates after each page
          
          // Stop if we have enough items
          if (itemLimit === '100' && results.length >= 100) break
          if (itemLimit === '300' && results.length >= 300) break
        }
        
        // Limit results based on itemLimit
        if (itemLimit === '100') {
          results = results.slice(0, 100)
        } else if (itemLimit === '300') {
          results = results.slice(0, 300)
        }
        // 'all' means keep all results
      } else if (bulkAddType === 'donghua-movie-china') {
        // Get donghua movie china only: Animation (16) + zh + CN
        setBulkAddProgress({ current: 0, total: 0, message: 'Fetching donghua movie china from TMDB...' })
        const movieParams: TMDBDiscoverParams = {
          with_genres: '16', // Animation
          with_original_language: 'zh', // Chinese
          with_origin_country: 'CN', // China
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const firstPageData = await tmdb.discover('movie', { ...movieParams, page: 1 })
        results = filterDonghuaOnly(firstPageData.results || [], 'movie')
        results = removeDuplicates(results)
        totalPages = Math.min(firstPageData.total_pages || 1, maxPages)
        
        // Calculate how many pages needed based on itemLimit
        let targetPages = maxPages
        if (itemLimit === '100') {
          targetPages = Math.min(maxPages, Math.ceil(100 / 20)) // ~5 pages for 100 items
        } else if (itemLimit === '300') {
          targetPages = Math.min(maxPages, Math.ceil(300 / 20)) // ~15 pages for 300 items
        } else {
          targetPages = maxPages // All
        }
        
        // Fetch more pages
        for (let page = 2; page <= Math.min(totalPages, targetPages); page++) {
          setBulkAddProgress({ current: results.length, total: 0, message: `Fetching page ${page}/${Math.min(totalPages, targetPages)}...` })
          const pageData = await tmdb.discover('movie', { ...movieParams, page })
          const filteredPageResults = filterDonghuaOnly(pageData.results || [], 'movie')
          results = [...results, ...filteredPageResults]
          results = removeDuplicates(results) // Remove duplicates after each page
          
          // Stop if we have enough items
          if (itemLimit === '100' && results.length >= 100) break
          if (itemLimit === '300' && results.length >= 300) break
        }
        
        // Limit results based on itemLimit
        if (itemLimit === '100') {
          results = results.slice(0, 100)
        } else if (itemLimit === '300') {
          results = results.slice(0, 300)
        }
        // 'all' means keep all results
      } else if (bulkAddType === 'by-genre' && selectedGenreId) {
        setBulkAddProgress({ current: 0, total: 0, message: 'Fetching donghua by genre from TMDB...' })
        // Get TV series with selected genre + donghua filters
        const genreParams: TMDBDiscoverParams = {
          with_genres: `16,${selectedGenreId}`, // Animation + selected genre
          with_original_language: 'zh',
          with_origin_country: 'CN',
          sort_by: 'popularity.desc',
          include_adult: false,
        }
        const tvData = await tmdb.discoverTV({ ...genreParams, page: 1 })
        results = filterDonghuaOnly(tvData.results || [], 'tv')
        results = removeDuplicates(results)
      }

      // Final deduplication before import
      results = removeDuplicates(results)
      
      // Limit results based on itemLimit
      if (itemLimit === '100') {
        results = results.slice(0, 100)
      } else if (itemLimit === '300') {
        results = results.slice(0, 300)
      }
      // 'all' means keep all results

      setBulkAddProgress({ current: 0, total: results.length, message: `Found ${results.length} items (after deduplication). Starting import...` })

      let successCount = 0
      let errorCount = 0
      let skippedCount = 0
      const existingTmdbIds = skipExisting ? new Set(
        donghuaList.map(d => d.tmdbId).filter(id => id && id > 0)
      ) : new Set()

      for (let i = 0; i < results.length; i++) {
        const item = results[i]
        const itemType = 'tv' as 'movie' | 'tv' // Always TV for donghua
        
        // Skip if already exists
        if (existingTmdbIds.has(item.id)) {
          skippedCount++
          setBulkAddProgress({ 
            current: i + 1, 
            total: results.length, 
            message: `Skipping ${item.title || item.name} (already exists)...` 
          })
          continue
        }

        setBulkAddProgress({ 
          current: i + 1, 
          total: results.length, 
          message: `Adding ${item.title || item.name}...` 
        })

        try {
          await api.syncFromTMDB({
            tmdbId: item.id,
            type: itemType,
            status: defaultStatus,
            episodeCount: itemType === 'tv' ? (item.number_of_episodes || 0) : undefined,
            releaseDate: itemType === 'movie' && item.release_date ? item.release_date : undefined,
            firstAirDate: itemType === 'tv' && item.first_air_date ? item.first_air_date : undefined,
            voteAverage: item.vote_average || 0,
            voteCount: item.vote_count || 0,
          })
          successCount++
        } catch (error) {
          console.error(`Error adding ${item.title || item.name}:`, error)
          errorCount++
        }

        // Small delay to avoid rate limiting
        if (i < results.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }

      setBulkAddProgress({ 
        current: results.length, 
        total: results.length, 
        message: `Completed! Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}` 
      })

      // Only refresh if successful (at least some items were added)
      if (successCount > 0) {
        // Refresh the list after a delay to show completion message
        setTimeout(() => {
          fetchData()
          setBulkAddLoading(false)
        }, 2000)
      } else {
        // If no items were added, don't refresh, just show message
        setBulkAddProgress({ 
          current: 0, 
          total: 0, 
          message: `No items added. Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errorCount}` 
        })
        // Reset loading after showing message
        setTimeout(() => {
          setBulkAddLoading(false)
        }, 2000)
      }
    } catch (error) {
      console.error('Bulk add error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      // Extract more detailed error message if available
      let detailedMessage = errorMessage
      if (error instanceof Error && error.message.includes('TMDB API Error')) {
        detailedMessage = error.message
      }
      
      setBulkAddProgress({ 
        current: 0, 
        total: 0, 
        message: `Error: ${detailedMessage}` 
      })
      
      // Set error message to display in UI
      setErrorMessage(`Gagal melakukan bulk add: ${detailedMessage}. Silakan periksa koneksi dan parameter filter Anda.`)
      
      // Also show alert as backup
      setTimeout(() => {
        try {
          alert(`Gagal melakukan bulk add: ${detailedMessage}\n\nSilakan periksa koneksi dan parameter filter Anda.`)
        } catch (alertError) {
          console.error('Failed to show alert:', alertError)
        }
      }, 100)
      
      // Don't refresh on error, let user see the error and try again
      // Reset loading after showing error
      setTimeout(() => {
      setBulkAddLoading(false)
      }, 2000)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/admin">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Manage Donghua</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/add-donghua">
            <Button className="gap-2">
              Add New Donghua
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="gap-2 bg-yellow-500 hover:bg-yellow-600 text-yellow-950 border-yellow-600"
            onClick={() => setBulkAddDialogOpen(true)}
          >
            <Download className="h-4 w-4" />
            Tambah Donghua All List
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search donghua by title, Chinese title, or overview..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
            </Button>
            {(searchQuery || statusFilter !== "all" || typeFilter !== "all" || genreFilter || categoryFilter !== "all") && (
              <Button variant="ghost" onClick={clearFilters} className="gap-2">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-muted-foreground">
            Menampilkan{" "}
            <span className="font-medium">
              {Math.min(filteredList.length, pageSize)}
            </span>{" "}
            dari{" "}
            <span className="font-medium">{filteredList.length}</span> hasil (total{" "}
            <span className="font-medium">{donghuaList.length}</span> donghua)
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Per halaman:</span>
            <select
              className="flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs"
              value={pageSize}
              onChange={e => setPageSize(parseInt(e.target.value) || 20)}
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg p-4 space-y-4 bg-card"
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label htmlFor="statusFilter" className="text-sm font-medium mb-2 block">Status</label>
                <select
                  id="statusFilter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="complete">Complete</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>
              <div>
                <label htmlFor="typeFilter" className="text-sm font-medium mb-2 block">Media Type</label>
                <select
                  id="typeFilter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="tv">TV Series</option>
                  <option value="movie">Movie</option>
                </select>
              </div>
              <div>
                <label htmlFor="genreFilter" className="text-sm font-medium mb-2 block">Genre</label>
                <select
                  id="genreFilter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={genreFilter || ""}
                  onChange={(e) => setGenreFilter(e.target.value ? parseInt(e.target.value) : null)}
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
                <label htmlFor="categoryFilter" className="text-sm font-medium mb-2 block">Kategori</label>
                <select
                  id="categoryFilter"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="all">Semua Kategori</option>
                  <option value="movie-west">Movie Barat / Lainnya</option>
                  <option value="movie-china">Movie China</option>
                  <option value="anime-japan">Anime Jepang (TV)</option>
                  <option value="anime-china">Anime China (TV)</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Results count */}
      {/* Moved into toolbar above with page size */}

      {/* Donghua Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-[2/3] bg-muted"></div>
              <div className="p-4 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No donghua found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.slice(0, pageSize).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-[2/3] bg-muted relative group">
                  {item.poster_path && (
                    <img
                      src={getImageUrl(item.poster_path)}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg'
                      }}
                    />
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-black/70 rounded text-xs text-white">
                      {item.media_type === 'tv' ? 'TV' : 'Movie'}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-1 line-clamp-1">{item.title}</h3>
                  {item.chineseTitle && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                      {item.chineseTitle}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">
                      {item.status || 'ongoing'}
                    </span>
                    {item.episode_count && (
                      <span className="text-xs text-muted-foreground">
                        {item.episode_count} eps
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => navigate(`/admin/edit-donghua/${item.id}`)}
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="flex-1 gap-2"
                      onClick={() => {
                        setSelectedItem(item)
                        setDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Donghua</DialogTitle>
            <DialogClose onClose={() => setDeleteDialogOpen(false)} />
          </DialogHeader>
          <div className="space-y-4">
            <p>
              Are you sure you want to delete "{selectedItem?.title}"? This
              action cannot be undone and will also delete all associated episodes.
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Dialog */}
      <Dialog open={bulkAddDialogOpen} onOpenChange={(open) => {
        // Prevent closing dialog if bulk add is in progress
        if (!open && bulkAddLoading) {
          console.warn('Cannot close dialog while bulk add is in progress')
          return
        }
        
        setBulkAddDialogOpen(open)
        if (open) {
          // Reset states when dialog opens
          setShowPreview(false)
          setPreviewResults([])
          setSelectedGenres([])
          setActiveTab('source')
          setMediaType('tv')
          setDiscoverParams({
            sort_by: 'popularity.desc',
            include_adult: false,
          })
          setBulkAddProgress({ current: 0, total: 0, message: '' })
          setErrorMessage(null)
        } else {
          // Reset states when dialog closes (only if not loading)
          if (!bulkAddLoading) {
          setShowPreview(false)
          setPreviewResults([])
          setSelectedGenres([])
            setBulkAddProgress({ current: 0, total: 0, message: '' })
            setErrorMessage(null)
          }
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Tambah Donghua All List - Advanced
            </DialogTitle>
            <DialogClose onClose={() => setBulkAddDialogOpen(false)} />
          </DialogHeader>
          
          {/* Error Message Display */}
          {errorMessage && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                    Error
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
          
            {!bulkAddLoading ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="source">Sumber Data</TabsTrigger>
                <TabsTrigger value="filters">Filter</TabsTrigger>
                <TabsTrigger value="settings">Pengaturan</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>

              {/* Source Tab */}
              <TabsContent value="source" className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      Fitur Import Massal dari TMDB
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Fitur ini akan menambahkan donghua secara massal dari TMDB. Proses ini mungkin memakan waktu beberapa menit tergantung jumlah data yang diimport.
                    </p>
                  </div>
                </div>

                <Card>
                  <div className="p-4 space-y-3">
                    <label className="text-sm font-medium mb-2 block">Pilih Sumber Data</label>
                    <div className="space-y-2">
                        <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
                          <input
                            type="radio"
                            name="bulkType"
                            value="donghua-china"
                            checked={bulkAddType === 'donghua-china'}
                            onChange={(e) => setBulkAddType(e.target.value as any)}
                            className="h-4 w-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <p className="font-semibold">Donghua/Anime China TV (Recommended)</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Otomatis mengambil donghua/anime China TV Series dengan filter: Animation (16) + Bahasa zh + Negara CN. Paling cepat dan mudah.
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
                          <input
                            type="radio"
                            name="bulkType"
                            value="donghua-movie-china"
                            checked={bulkAddType === 'donghua-movie-china'}
                            onChange={(e) => setBulkAddType(e.target.value as any)}
                            className="h-4 w-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <p className="font-semibold">Donghua Movie China</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Otomatis mengambil donghua Movie China dengan filter: Animation (16) + Bahasa zh + Negara CN. Memastikan movie anime china masuk ke database.
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent transition-colors">
                          <input
                            type="radio"
                            name="bulkType"
                            value="discover"
                            checked={bulkAddType === 'discover'}
                            onChange={(e) => setBulkAddType(e.target.value as any)}
                            className="h-4 w-4 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Sparkles className="h-4 w-4 text-primary" />
                              <p className="font-semibold">TMDB Discover (Advanced) — Custom filter</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Gunakan filter TMDB Discover untuk hasil yang lebih spesifik. Filter donghua (Animation + zh + CN) akan otomatis diterapkan.
                            </p>
                          </div>
                        </label>
                        
                        <label className="flex items-start space-x-3 p-4 border rounded-lg cursor-pointer hover:bg-accent transition-colors">
                        <input
                          type="radio"
                          name="bulkType"
                          value="by-genre"
                          checked={bulkAddType === 'by-genre'}
                          onChange={(e) => setBulkAddType(e.target.value as any)}
                            className="h-4 w-4 mt-1"
                        />
                          <div className="flex-1">
                          <p className="font-medium">Berdasarkan Genre + Donghua</p>
                            <p className="text-xs text-muted-foreground">
                              Tambah berdasarkan genre tertentu dengan filter donghua (Animation + zh + CN) otomatis diterapkan
                            </p>
                        </div>
                      </label>
                    </div>
                  </div>
                </Card>

                  {bulkAddType === 'by-genre' && (
                  <Card>
                    <div className="p-4">
                      <label htmlFor="selectedGenreId" className="text-sm font-medium mb-2 block">Pilih Genre</label>
                      <select
                        id="selectedGenreId"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={selectedGenreId || ""}
                        onChange={(e) => setSelectedGenreId(e.target.value ? parseInt(e.target.value) : null)}
                      >
                        <option value="">Pilih Genre</option>
                        {genres.map((genre) => (
                          <option key={genre.id} value={genre.id}>
                            {genre.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </Card>
                )}

                {bulkAddType === 'discover' && (
                  <Card>
                    <div className="p-4 space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-blue-800 dark:text-blue-200">
                            Mode ini hanya untuk TV Series (donghua/anime). Gunakan tab "Filter" untuk mengatur parameter discover yang lebih detail seperti genre tambahan, tahun, rating, dll.
                          </p>
                        </div>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Filters Tab */}
              <TabsContent value="filters" className="space-y-4">
                {bulkAddType === 'discover' ? (
                  <>
                    <Card>
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="releaseYear" className="text-sm font-medium mb-2 block">Tahun Rilis</label>
                            <Input
                              id="releaseYear"
                              type="number"
                              placeholder="2025"
                              value={discoverParams.primary_release_year || discoverParams.first_air_date_gte?.split('-')[0] || ''}
                              onChange={(e) => {
                                const year = e.target.value
                                if (year) {
                                  setDiscoverParams({
                                    ...discoverParams,
                                    first_air_date_gte: `${year}-01-01`,
                                    first_air_date_lte: `${year}-12-31`
                                  })
                                } else {
                                  const newParams = { ...discoverParams }
                                  delete newParams.first_air_date_gte
                                  delete newParams.first_air_date_lte
                                  setDiscoverParams(newParams)
                                }
                              }}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="originalLanguage" className="text-sm font-medium mb-2 block">Bahasa Asli (ISO 639-1)</label>
                            <Input
                              id="originalLanguage"
                              placeholder="zh, en, ja"
                              value={discoverParams.with_original_language || ''}
                              onChange={(e) => {
                                const lang = e.target.value
                                if (lang) {
                                  setDiscoverParams({ ...discoverParams, with_original_language: lang })
                                } else {
                                  const newParams = { ...discoverParams }
                                  delete newParams.with_original_language
                                  setDiscoverParams(newParams)
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Contoh: zh (Mandarin), en (English), ja (Japanese)
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="originCountry" className="text-sm font-medium mb-2 block">Negara Produksi (ISO 3166-1)</label>
                            <Input
                              id="originCountry"
                              placeholder="CN, US, JP"
                              value={discoverParams.with_origin_country || ''}
                              onChange={(e) => {
                                const country = e.target.value
                                if (country) {
                                  setDiscoverParams({ ...discoverParams, with_origin_country: country })
                                } else {
                                  const newParams = { ...discoverParams }
                                  delete newParams.with_origin_country
                                  setDiscoverParams(newParams)
                                }
                              }}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Contoh: CN (China), US (USA), JP (Japan)
                            </p>
                          </div>
                          
                          <div>
                            <label htmlFor="voteAverageGte" className="text-sm font-medium mb-2 block">Rating Minimum</label>
                            <Input
                              id="voteAverageGte"
                              type="number"
                              step="0.1"
                              placeholder="7.0"
                              value={discoverParams.vote_average_gte || ''}
                              onChange={(e) => {
                                const rating = e.target.value
                                if (rating) {
                                  setDiscoverParams({ ...discoverParams, vote_average_gte: parseFloat(rating) })
                                } else {
                                  const newParams = { ...discoverParams }
                                  delete newParams.vote_average_gte
                                  setDiscoverParams(newParams)
                                }
                              }}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="voteCountGte" className="text-sm font-medium mb-2 block">Min Vote Count</label>
                            <Input
                              id="voteCountGte"
                              type="number"
                              placeholder="100"
                              value={discoverParams.vote_count_gte || ''}
                              onChange={(e) => {
                                const count = e.target.value
                                if (count) {
                                  setDiscoverParams({ ...discoverParams, vote_count_gte: parseInt(count) })
                                } else {
                                  const newParams = { ...discoverParams }
                                  delete newParams.vote_count_gte
                                  setDiscoverParams(newParams)
                                }
                              }}
                            />
                          </div>
                          
                          <div>
                            <label htmlFor="sortBy" className="text-sm font-medium mb-2 block">Sort By</label>
                            <select
                              id="sortBy"
                              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={discoverParams.sort_by || 'popularity.desc'}
                              onChange={(e) => setDiscoverParams({ ...discoverParams, sort_by: e.target.value as any })}
                            >
                              <option value="popularity.desc">Popularitas (Tinggi → Rendah)</option>
                              <option value="popularity.asc">Popularitas (Rendah → Tinggi)</option>
                              <option value="vote_average.desc">Rating (Tinggi → Rendah)</option>
                              <option value="vote_average.asc">Rating (Rendah → Tinggi)</option>
                              <option value="release_date.desc">Tanggal Rilis (Terbaru)</option>
                              <option value="release_date.asc">Tanggal Rilis (Terlama)</option>
                              <option value="first_air_date.desc">Tanggal Tayang (Terbaru)</option>
                              <option value="first_air_date.asc">Tanggal Tayang (Terlama)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label htmlFor="tmdbGenres" className="text-sm font-medium mb-2 block">Genre</label>
                          {loadingTmdbGenres ? (
                            <div className="flex items-center justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="ml-2 text-sm text-muted-foreground">Loading genres...</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {tmdbGenres.map((genre) => (
                                  <Button
                                    key={genre.id}
                                    type="button"
                                    variant={selectedGenres.includes(genre.id) ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => toggleGenre(genre.id)}
                                    className="h-8"
                                  >
                                    {genre.name}
                                    {selectedGenres.includes(genre.id) && (
                                      <X className="h-3 w-3 ml-1" />
                                    )}
                                  </Button>
                                ))}
                              </div>
                              {selectedGenres.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedGenres([])
                                      const newParams = { ...discoverParams }
                                      delete newParams.with_genres
                                      setDiscoverParams(newParams)
                                    }}
                                    className="h-7 text-xs"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear All
                                  </Button>
                                  <span className="text-xs text-muted-foreground">
                                    {selectedGenres.length} genre(s) selected
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="includeAdult"
                            checked={discoverParams.include_adult || false}
                            onChange={(e) => setDiscoverParams({ ...discoverParams, include_adult: e.target.checked })}
                            className="h-4 w-4"
                          />
                          <label htmlFor="includeAdult" className="text-sm">
                            Include Adult Content
                          </label>
                        </div>
                      </div>
                    </Card>
                  </>
                ) : (
                  <Card>
                    <div className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Info className="h-4 w-4" />
                        <p className="text-sm">
                          Filter hanya tersedia untuk mode "TMDB Discover". Pilih "TMDB Discover" di tab Sumber Data untuk menggunakan filter.
                        </p>
                      </div>
                    </div>
                  </Card>
                )}
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-4">
                <Card>
                  <div className="p-4 space-y-4">
                    <div>
                      <label htmlFor="itemLimit" className="text-sm font-medium mb-2 block">
                        Jumlah Item yang Diambil
                      </label>
                      <select
                        id="itemLimit"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={itemLimit}
                        onChange={(e) => setItemLimit(e.target.value as '100' | '300' | 'all')}
                      >
                        <option value="100">100 Items</option>
                        <option value="300">300 Items</option>
                        <option value="all">All Items (Semua)</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pilih jumlah item yang akan diambil dari TMDB. "All" akan mengambil semua item yang tersedia (tergantung max pages). Duplikat akan otomatis dihapus.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="maxPages" className="text-sm font-medium mb-2 block">Maksimal Halaman</label>
                      <Input
                        id="maxPages"
                        type="number"
                        min="1"
                        max="20"
                        value={maxPages}
                        onChange={(e) => setMaxPages(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Setiap halaman berisi ~20 item. Maksimal 20 halaman (~400 item). Hanya digunakan jika "All Items" dipilih.
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="defaultStatus" className="text-sm font-medium mb-2 block">Status Default</label>
                      <select
                        id="defaultStatus"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={defaultStatus}
                        onChange={(e) => setDefaultStatus(e.target.value as any)}
                      >
                        <option value="ongoing">Ongoing</option>
                        <option value="complete">Complete</option>
                        <option value="upcoming">Upcoming</option>
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Status yang akan diberikan ke semua donghua yang diimport
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="skipExisting"
                        checked={skipExisting}
                        onChange={(e) => setSkipExisting(e.target.checked)}
                        className="h-4 w-4"
                      />
                      <label htmlFor="skipExisting" className="text-sm">
                        Skip item yang sudah ada (berdasarkan TMDB ID)
                      </label>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Preview Tab */}
              <TabsContent value="preview" className="space-y-4">
                <Card>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold">Preview Hasil</h3>
                        <p className="text-xs text-muted-foreground">
                          Preview akan menampilkan 20 item pertama yang akan diimport
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handlePreview(e)
                        }}
                        disabled={previewLoading || (bulkAddType === 'by-genre' && !selectedGenreId)}
                      >
                        {previewLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <Eye className="h-4 w-4 mr-2" />
                            Load Preview
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {previewLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : showPreview && previewResults.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {previewResults.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 p-2 border rounded hover:bg-accent">
                            {item.poster_path && (
                              <img
                                src={tmdb.getImageUrl(item.poster_path, 'w92')}
                                alt={item.title || item.name}
                                className="w-12 h-16 object-cover rounded"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{item.title || item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.media_type || 'tv'} • 
                                Rating: {item.vote_average?.toFixed(1) || 'N/A'} • 
                                Votes: {item.vote_count || 0}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : showPreview && previewResults.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Tidak ada hasil ditemukan</p>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Klik "Load Preview" untuk melihat preview hasil</p>
                      </div>
                    )}
                  </div>
                </Card>
              </TabsContent>
            </Tabs>

            ) : (
              <div className="space-y-4 py-4">
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
                <div className="text-center space-y-2">
                  <p className="font-medium">{bulkAddProgress.message}</p>
                  {bulkAddProgress.total > 0 && (
                    <>
                    <div className="w-full bg-muted rounded-full h-3">
                        <div
                        className="bg-primary h-3 rounded-full transition-all"
                          style={{ width: `${(bulkAddProgress.current / bulkAddProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                      {bulkAddProgress.current} / {bulkAddProgress.total} ({Math.round((bulkAddProgress.current / bulkAddProgress.total) * 100)}%)
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}

          {!bulkAddLoading && (
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setBulkAddDialogOpen(false)
                  setShowPreview(false)
                  setPreviewResults([])
                }}
              >
                Cancel
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handlePreview(undefined)
                  }}
                  disabled={previewLoading || (bulkAddType === 'by-genre' && !selectedGenreId)}
                >
                  {previewLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (e.nativeEvent) {
                      e.nativeEvent.stopImmediatePropagation()
                    }
                    handleBulkAdd(e)
                  }}
                  disabled={(bulkAddType === 'by-genre' && !selectedGenreId) || bulkAddLoading}
                  className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Mulai Import
                </Button>
          </div>
            </div>
          )}
        </DialogContent>
      </Dialog>


      {/* Selection Dialog */}
      <Dialog 
        open={showSelectionDialog} 
        onOpenChange={(open) => {
        // Prevent closing if loading
        if (!open && (selectionLoading || bulkAddLoading)) {
          return
        }
          setShowSelectionDialog(open)
          if (!open) {
            setSelectionResults([])
            setSelectedItems(new Set())
          }
        }}
      >
        <DialogContent 
          className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={(e) => {
            // Prevent any clicks inside dialog from bubbling
            e.stopPropagation()
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Pilih Item untuk Di-import ({selectedItems.size} / {selectionResults.length} terpilih)</span>
              <DialogClose 
                onClose={() => {
                  if (!selectionLoading && !bulkAddLoading) {
                    setShowSelectionDialog(false)
                    setSelectionResults([])
                    setSelectedItems(new Set())
                  }
                }} 
              />
            </DialogTitle>
          </DialogHeader>
          
          {selectionLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Memuat hasil...</span>
            </div>
          ) : selectionResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Tidak ada hasil ditemukan</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="selectAll"
                    checked={selectedItems.size === selectionResults.length && selectionResults.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="selectAll" className="text-sm font-medium cursor-pointer">
                    {selectedItems.size === selectionResults.length ? 'Deselect All' : 'Select All'}
                  </label>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedItems.size} dari {selectionResults.length} item terpilih
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {selectionResults.map((item) => {
                  const isSelected = selectedItems.has(item.id)
                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                      }`}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        handleToggleItem(item.id)
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={isSelected}
                        onChange={() => handleToggleItem(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 cursor-pointer"
                        aria-label={`Select ${item.title || item.name}`}
                      />
                      {item.poster_path && (
                        <img
                          src={tmdb.getImageUrl(item.poster_path, 'w92')}
                          alt={item.title || item.name}
                          className="w-16 h-24 object-cover rounded flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder.jpg'
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm truncate">{item.title || item.name}</h4>
                            {item.original_title && item.original_title !== (item.title || item.name) && (
                              <p className="text-xs text-muted-foreground truncate">{item.original_title}</p>
                            )}
                            {item.overview && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{item.overview}</p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground flex-shrink-0">
                            <span className="px-2 py-1 rounded bg-muted">
                              {item.media_type || mediaType}
                            </span>
                            {item.vote_average && (
                              <span>⭐ {item.vote_average.toFixed(1)}</span>
                            )}
                            {(item.release_date || item.first_air_date) && (
                              <span>📅 {item.release_date || item.first_air_date}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="flex justify-between items-center pt-4 border-t mt-4">
                <div className="text-sm text-muted-foreground">
                  {selectedItems.size} item dipilih untuk di-import
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowSelectionDialog(false)
                      setSelectionResults([])
                      setSelectedItems(new Set())
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (e.nativeEvent) {
                        e.nativeEvent.stopImmediatePropagation()
                      }
                      handleInsertSelected(e)
                    }}
                    disabled={selectedItems.size === 0 || bulkAddLoading}
                    className="bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Import {selectedItems.size} Item
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
