import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';

const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const { customer, district, state } = useCustomerAuth();

    const [movie, setMovie] = useState(null);
    const [cinemaHalls, setCinemaHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refetching, setRefetching] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [descExpanded, setDescExpanded] = useState(false);

    useEffect(() => {
        fetchMovieShowtimes();
    }, [movieId, selectedDate]);

    const fetchMovieShowtimes = async () => {
        try {
            if (movie) {
                setRefetching(true);
            } else {
                setLoading(true);
            }

            const dateStr = selectedDate.toISOString().split('T')[0];
            const data = await customerMoviesAPI.getMovieDetailsWithShowtimes(movieId, district, state, dateStr);
            setMovie(data.movie);
            setCinemaHalls(data.cinema_halls || []);
        } catch (error) {
            console.error('Failed to fetch movie showtimes:', error);
            toast.error('Failed to load showtimes');
        } finally {
            setLoading(false);
            setRefetching(false);
        }
    };

    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    const getNextDates = () => {
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const formatDuration = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
    };

    const formatDateParts = (date) => ({
        dow: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="animate-pulse">
                    <div className="h-64 bg-muted"></div>
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6 space-y-4">
                        <div className="h-8 bg-muted rounded w-1/3"></div>
                        <div className="h-5 bg-muted rounded w-1/4"></div>
                        <div className="h-16 bg-muted rounded w-2/3"></div>
                    </div>
                    <div className="bg-card border-b border-border py-4">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-14 flex gap-3">
                            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                                <div key={i} className="w-14 h-16 bg-muted rounded-lg flex-shrink-0"></div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!movie) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Movie not found</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">

            {/* Section 1: Cinematic Banner Header */}
            <div className="relative overflow-hidden min-h-[320px] md:min-h-[380px]">

                {/* Layer 1: Blurred background poster */}
                {movie.poster_url && (
                    <img
                        src={movie.poster_url}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-md scale-110 opacity-40 pointer-events-none"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                )}

                {/* Layer 2: Dark gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent pointer-events-none" />

                {/* Back button */}
                <div className="absolute top-4 left-4 sm:left-6 lg:left-14 z-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition bg-background/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        {/* Back */}
                    </button>
                </div>

                {/* Layer 3: Content */}
                <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-14 pb-8 pt-16 flex gap-6 items-end">

                    {/* Poster thumbnail — hidden on mobile */}
                    <div className="hidden sm:block flex-shrink-0 w-36 md:w-44">
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full rounded-xl shadow-2xl object-cover aspect-[2/3]"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                    </div>

                    {/* Movie info */}
                    <div className="flex-1 min-w-0">
                        <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
                            {movie.title}
                        </h1>

                        {/* Tag pills */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                            {movie.duration_mins && (
                                <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm font-medium">
                                    Movie runtime: {formatDuration(movie.duration_mins)}
                                </span>
                            )}
                            {movie.genre?.map((g, i) => (
                                <span key={i} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm">
                                    {g}
                                </span>
                            ))}
                            {movie.language?.map((lang, i) => (
                                <span key={i} className="px-3 py-1 border border-border text-muted-foreground rounded-full text-sm">
                                    {lang}
                                </span>
                            ))}
                        </div>

                        {/* Description */}
                        {movie.description && (
                            <div>
                                <p className={`text-sm text-muted-foreground leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
                                    {movie.description}
                                </p>
                                <button
                                    onClick={() => setDescExpanded(!descExpanded)}
                                    className="text-xs text-primary mt-1 hover:underline focus:outline-none"
                                >
                                    {descExpanded ? 'Show less' : 'Read more'}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Section 2: Date Selector + Language Chip */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14">
                    <div className="flex items-center justify-between gap-4 py-3">

                        {/* Scrollable date buttons */}
                        <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            {getNextDates().map((date, index) => {
                                const { dow, day, month } = formatDateParts(date);
                                const isSelected = date.toDateString() === selectedDate.toDateString();
                                return (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedDate(date)}
                                        className={`flex-shrink-0 flex flex-col items-center justify-center w-14 py-2 rounded-lg transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-primary text-primary-foreground shadow-sm'
                                                : 'border border-border text-foreground hover:border-primary hover:text-primary'
                                        }`}
                                    >
                                        <span className="text-[10px] font-semibold tracking-wider leading-none">{dow}</span>
                                        <span className="text-xl font-bold leading-tight">{day}</span>
                                        <span className="text-[10px] font-semibold tracking-wider leading-none">{month}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Language chip */}
                        <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm text-muted-foreground bg-background font-medium whitespace-nowrap">
                                {movie.language?.[0] ?? 'Original'}
                                <span className="opacity-40">•</span>
                                2D
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 3: Subtitle hint + Availability Legend */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-2">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground hidden sm:block">
                        Language shown indicates audio; subtitle language may vary.
                    </p>
                    <div className="flex-1 sm:flex-none" />
                    <div className="flex items-center gap-4 text-xs font-semibold tracking-wide">
                        <span className="flex items-center gap-1.5 text-green-600 dark:text-green-500">
                            <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span>
                            AVAILABLE
                        </span>
                        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-500">
                            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
                            FAST FILLING
                        </span>
                    </div>
                </div>
            </div>

            {/* Section 4: Cinema Hall Cards */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 pb-10">
                {refetching ? (
                    <div className="space-y-4 animate-pulse">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 bg-muted rounded"></div>
                                        <div>
                                            <div className="h-4 bg-muted rounded w-40 mb-1"></div>
                                            <div className="h-3 bg-muted rounded w-28"></div>
                                        </div>
                                    </div>
                                    <div className="h-5 w-5 bg-muted rounded-full"></div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="h-14 w-24 bg-muted rounded-lg"></div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : cinemaHalls.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-10 text-center">
                        <svg className="w-12 h-12 text-muted-foreground mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        <p className="text-muted-foreground font-medium">No shows available for this date</p>
                        <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cinemaHalls.map((hall) => (
                            <div key={hall.cinema_hall_id} className="bg-card border border-border rounded-xl p-5">

                                {/* Card header */}
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-4 8h4" />
                                        </svg>
                                        <div>
                                            <h3 className="font-bold text-base text-foreground leading-tight">{hall.cinema_hall_name}</h3>
                                            {hall.cinema_hall_location && (
                                                <p className="text-xs text-muted-foreground mt-0.5">{hall.cinema_hall_location}</p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="p-1 text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                                        aria-label="Add to favourites"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Show time buttons */}
                                {hall.shows && hall.shows.length > 0 ? (
                                    <>
                                        <div className="flex flex-wrap gap-3">
                                            {[...hall.shows]
                                                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                                .map((show) => (
                                                    <button
                                                        key={show.show_id}
                                                        onClick={() => navigate(`/show/${show.show_id}`)}
                                                        className="flex flex-col items-center justify-center px-4 py-2 min-w-[88px] border border-green-500 rounded-lg text-green-700 dark:text-green-400 hover:border-primary hover:text-primary transition-colors duration-150"
                                                    >
                                                        <span className="font-bold text-sm leading-tight">
                                                            {show.start_time ? formatTime(show.start_time) : '--:--'}
                                                        </span>
                                                        <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 max-w-[80px] truncate">
                                                            {show.screen_name}
                                                        </span>
                                                    </button>
                                                ))
                                            }
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-3">Non-cancellable</p>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">No shows available</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieDetailsPage;
