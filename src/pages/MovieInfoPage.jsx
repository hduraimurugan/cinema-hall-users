import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerMoviesAPI, adsAPI } from '../services/api';

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
    const [sideAds, setSideAds] = useState([]);

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

    useEffect(() => {
        adsAPI.getActive('side').then((data) => setSideAds(data.ads)).catch(() => {});
    }, []);

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

    const handleAdClick = (ad) => {
        adsAPI.recordClick(ad.id).catch(() => {});
        if (ad.click_url) window.open(ad.click_url, '_blank', 'noopener,noreferrer');
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
    const hasSideAds = sideAds.length > 0;

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
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/10 pointer-events-none" />

                {/* Back button */}
                <div className="absolute top-4 left-4 sm:left-6 lg:left-14 z-10">
                    {/* <button
                        onClick={() => navigate('/movies')}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button> */}
                    <button
                        onClick={() => navigate(-1)}
                        className="p-1.5 sm:p-2 bg-secondary rounded-md transition flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            {movie.vote_average !== undefined && parseFloat(movie.vote_average) > 0 && (
                                <>
                                    <span className="text-muted-foreground/50">•</span>
                                    <span className="flex items-center gap-1 text-sm font-medium text-yellow-400">
                                        <svg className="w-4 h-4 fill-yellow-400" viewBox="0 0 24 24">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                        {parseFloat(movie.vote_average).toFixed(1)}
                                        <span className="text-muted-foreground font-normal">/ 10</span>
                                        {movie.vote_count > 0 && (
                                            <span className="text-muted-foreground font-normal">
                                                · {movie.vote_count >= 1000 ? `${(movie.vote_count / 1000).toFixed(0)}K` : movie.vote_count} Votes
                                            </span>
                                        )}
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

            {/* Content area: main content + optional side ad column */}
            <div className={`container mx-auto px-4 sm:px-6 lg:px-14 ${hasSideAds ? 'flex gap-8 items-start' : ''}`}>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                    {/* About the Movie Section */}
                    {movie.description && (
                        <div className="py-8 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground mb-3">About the movie</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                                {movie.description}
                            </p>
                        </div>
                    )}

                    {/* Cast Section */}
                    {movie.cast && movie.cast.length > 0 && (
                        <div className="py-8 border-b border-border">
                            <h2 className="text-lg font-bold text-foreground mb-5">Cast</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {movie.cast.map((member, index) => {
                                    const imgSrc = member.profile_path
                                        ? member.profile_path.startsWith('http')
                                            ? member.profile_path
                                            : `https://image.tmdb.org/t/p/w185${member.profile_path}`
                                        : null;
                                    return (
                                        <div key={index} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 hover:border-border transition-colors">
                                            {imgSrc ? (
                                                <img
                                                    src={imgSrc}
                                                    alt={member.name}
                                                    className="w-11 h-11 rounded-full object-cover shrink-0 shadow-sm"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextSibling.style.display = 'flex';
                                                    }}
                                                />
                                            ) : null}
                                            <div
                                                className="w-11 h-11 rounded-full bg-muted shrink-0 items-center justify-center text-muted-foreground text-base font-bold"
                                                style={{ display: imgSrc ? 'none' : 'flex' }}
                                            >
                                                {member.name.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                                                {member.character && (
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">{member.character}</p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Trailer Section */}
                    {embedUrl && (
                        <div ref={trailerRef} className="py-8">
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

                {/* Side ads — only on md+ screens */}
                {hasSideAds && (
                    <div className="hidden md:flex flex-col gap-4 w-44 lg:w-48 shrink-0 sticky top-24 pt-8">
                        {sideAds.map((ad) => (
                            <div
                                key={ad.id}
                                onClick={() => handleAdClick(ad)}
                                className={`rounded-lg overflow-hidden border border-border shadow-sm ${ad.click_url ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                            >
                                <img
                                    src={ad.image_url}
                                    alt={ad.title}
                                    className="w-full h-auto object-cover"
                                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieInfoPage;
