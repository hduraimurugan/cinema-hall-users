import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    // Already an embed URL
    if (url.includes('youtube.com/embed/')) return url;
    // youtu.be/VIDEO_ID
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
    if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
    // youtube.com/watch?v=VIDEO_ID
    const watchMatch = url.match(/[?&]v=([^?&]+)/);
    if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
    return null;
};

const MovieInfoPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const trailerRef = useRef(null);

    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMovie = async () => {
            try {
                setLoading(true);
                const data = await customerMoviesAPI.getMovieById(movieId);
                setMovie(data.movie);
            } catch (err) {
                console.error('Failed to fetch movie:', err);
                setError('Movie not found');
            } finally {
                setLoading(false);
            }
        };
        fetchMovie();
    }, [movieId]);

    const formatDuration = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
    };

    const formatReleaseDate = (dateStr) => {
        if (!dateStr) return null;
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const scrollToTrailer = () => {
        trailerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background animate-pulse">
                <div className="h-72 bg-muted" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-8 space-y-4">
                    <div className="h-7 bg-muted rounded w-1/2" />
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-20 bg-muted rounded w-3/4 mt-4" />
                    <div className="h-12 bg-muted rounded w-40 mt-6" />
                </div>
            </div>
        );
    }

    if (error || !movie) {
        return (
            <div className="container mx-auto px-4 py-16 text-center">
                <p className="text-muted-foreground">{error || 'Movie not found'}</p>
                <button
                    onClick={() => navigate('/movies')}
                    className="mt-4 text-primary text-sm hover:underline"
                >
                    Back to Movies
                </button>
            </div>
        );
    }

    const embedUrl = getYouTubeEmbedUrl(movie.trailer_url);

    return (
        <div className="min-h-screen bg-background">

            {/* Hero Section */}
            <div className="relative overflow-hidden">

                {/* Blurred background poster */}
                {movie.poster_url && (
                    <img
                        src={movie.poster_url}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40 pointer-events-none"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                )}

                {/* Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/30 pointer-events-none" />

                {/* Back button */}
                <div className="absolute top-4 left-4 sm:left-6 lg:left-14 z-10">
                    <button
                        onClick={() => navigate('/movies')}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Hero content */}
                <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-14 pt-16 pb-10 flex flex-col sm:flex-row gap-8 items-start sm:items-end">

                    {/* Poster with optional Trailer button overlay */}
                    {movie.poster_url && (
                        <div className="flex-shrink-0 w-40 sm:w-52 md:w-60 mx-auto sm:mx-0">
                            <div className="relative group">
                                <img
                                    src={movie.poster_url}
                                    alt={movie.title}
                                    className="w-full rounded-2xl shadow-2xl object-cover aspect-[2/3]"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                                {/* Trailer overlay button */}
                                {embedUrl && (
                                    <button
                                        onClick={scrollToTrailer}
                                        className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 py-2.5 bg-black/70 rounded-b-2xl text-white text-sm font-medium hover:bg-black/85 transition-colors"
                                    >
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                        Trailer
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Movie Metadata */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground leading-tight mb-4">
                            {movie.title}
                        </h1>

                        {/* Meta row */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                            {movie.duration_mins && (
                                <span className="text-sm text-muted-foreground">
                                    {formatDuration(movie.duration_mins)}
                                </span>
                            )}
                            {movie.duration_mins && (movie.genre?.length > 0) && (
                                <span className="text-muted-foreground/50">•</span>
                            )}
                            {movie.genre?.map((g, i) => (
                                <span key={i} className="text-sm text-muted-foreground">
                                    {g}{i < movie.genre.length - 1 ? ',' : ''}
                                </span>
                            ))}
                            {movie.release_date && (
                                <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="text-sm text-muted-foreground">
                                        {formatReleaseDate(movie.release_date)}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* Format + Language badges */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            <span className="px-3 py-1 border border-border rounded text-xs font-medium text-foreground bg-background/50 backdrop-blur-sm">
                                2D
                            </span>
                            {movie.language?.map((lang, i) => (
                                <span key={i} className="px-3 py-1 border border-border rounded text-xs font-medium text-foreground bg-background/50 backdrop-blur-sm">
                                    {lang}
                                </span>
                            ))}
                        </div>

                        {/* Book Tickets CTA */}
                        <button
                            onClick={() => navigate(`/movie/shows/${movieId}`)}
                            className="px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-base shadow-lg cursor-pointer"
                        >
                            Book Tickets
                        </button>
                    </div>
                </div>
            </div>

            {/* About the Movie Section */}
            {movie.description && (
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-8 border-b border-border">
                    <h2 className="text-lg font-bold text-foreground mb-3">About the movie</h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                        {movie.description}
                    </p>
                </div>
            )}

            {/* Trailer Section */}
            {embedUrl && (
                <div ref={trailerRef} className="container mx-auto px-4 sm:px-6 lg:px-14 py-8">
                    <h2 className="text-lg font-bold text-foreground mb-4">Trailer</h2>
                    <div className="max-w-3xl">
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl">
                            <iframe
                                src={embedUrl}
                                title={`${movie.title} Trailer`}
                                className="absolute inset-0 w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MovieInfoPage;
