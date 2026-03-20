import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Clock, Calendar, Play } from "lucide-react"
import { customerMoviesAPI } from "../services/api"
import { LazyLoadImage } from "react-lazy-load-image-component"
import "react-lazy-load-image-component/src/effects/blur.css"
import { useNavigate } from "react-router-dom"

const SearchMovies = () => {
    const navigate = useNavigate()
    const [searchValue, setSearchValue] = useState("")
    const [isSearchFocused, setIsSearchFocused] = useState(false)
    const [movies, setMovies] = useState([])
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [showResults, setShowResults] = useState(false)

    const debouncedSearch = useCallback(
        debounce(async (searchTerm) => {
            if (!searchTerm.trim()) {
                setMovies([])
                setShowResults(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                const response = await customerMoviesAPI.getAllMovies({
                    search: searchTerm,
                    limit: 8,
                })
                setMovies(response.movies || [])
                setShowResults(true)
            } catch (err) {
                setError(err.message)
                setMovies([])
            } finally {
                setIsLoading(false)
            }
        }, 300),
        [],
    )

    useEffect(() => {
        debouncedSearch(searchValue)
    }, [searchValue, debouncedSearch])

    const handleMovieClick = (movieId) => {
        navigate(`/movie/${movieId}`)
        setShowResults(false)
        setSearchValue("")
    }

    const formatDuration = (minutes) => {
        const hours = Math.floor(minutes / 60)
        const mins = minutes % 60
        return `${hours}h ${mins}m`
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    return (
        <div className="hidden sm:flex flex-1 max-w-xl mx-4 relative">
            <form onSubmit={(e) => e.preventDefault()} className="relative w-full">
                <Search
                    className={`absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 z-10 ${isSearchFocused ? "text-primary" : "text-muted-foreground"}`}
                />
                <Input
                    type="search"
                    placeholder="Search movies, events, shows..."
                    className="pl-10 h-9 rounded-full bg-secondary/50 border-transparent focus-visible:border-primary/30 focus-visible:ring-primary/20 text-sm transition-all duration-200"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setTimeout(() => {
                        setIsSearchFocused(false)
                        setShowResults(false)
                    }, 200)}
                />
            </form>

            {(showResults || isLoading) && searchValue.trim() && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                    {isLoading && (
                        <div className="p-4 space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex space-x-3">
                                    <Skeleton className="h-16 w-12 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {error && (
                        <div className="p-4 text-center text-muted-foreground">
                            <p>Error: {error}</p>
                        </div>
                    )}

                    {!isLoading && movies.length === 0 && searchValue.trim() && (
                        <div className="p-4 text-center text-muted-foreground">
                            <p>No movies found for "{searchValue}"</p>
                        </div>
                    )}

                    {!isLoading && movies.length > 0 && (
                        <div className="p-2">
                            {movies.map((movie) => (
                                <Card
                                    key={movie.id}
                                    className="mb-1 cursor-pointer hover:bg-accent/50 transition-colors border-0 shadow-none"
                                    onClick={() => handleMovieClick(movie.id)}
                                >
                                    <CardContent className="p-3">
                                        <div className="flex space-x-3">
                                            <div className="relative h-16 w-12 flex-shrink-0 rounded overflow-hidden bg-secondary">
                                                {movie.poster_url ? (
                                                    <LazyLoadImage
                                                        src={movie.poster_url}
                                                        alt={movie.title}
                                                        effect="blur"
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <Play className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-medium text-sm truncate mb-1">{movie.title}</h3>

                                                {movie.genre && movie.genre.length > 0 && (
                                                    <p className="text-xs text-muted-foreground mb-1">{movie.genre[0]}</p>
                                                )}

                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    {movie.duration_mins && (
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            <span>{formatDuration(movie.duration_mins)}</span>
                                                        </div>
                                                    )}
                                                    {movie.release_date && (
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3" />
                                                            <span>{formatDate(movie.release_date)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function debounce(func, wait) {
    let timeout
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout)
            func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
    }
}

export default SearchMovies
