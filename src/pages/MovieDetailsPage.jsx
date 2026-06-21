import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LocationModal } from '../components/LocationModal';
import { Building2, MapPin, Compass, Heart, Film } from 'lucide-react';

const MovieDetailsPage = () => {
    const { movieId } = useParams();
    const navigate = useNavigate();
    const { district, state } = useCustomerAuth();

    const [movie, setMovie] = useState(null);
    const [cinemaHalls, setCinemaHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refetching, setRefetching] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [descExpanded, setDescExpanded] = useState(false);
    const [locationModalOpen, setLocationModalOpen] = useState(false);

    // Track favourite theatres in local storage
    const [favourites, setFavourites] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('favourite_theatres') || '[]');
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        if (!district && !state) {
            setLoading(false);
            setLocationModalOpen(true);
        } else {
            fetchMovieShowtimes();
        }
    }, [movieId, selectedDate, district, state]);

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

    const toggleFavourite = (hallId) => {
        let updated;
        if (favourites.includes(hallId)) {
            updated = favourites.filter(id => id !== hallId);
            toast.success('Removed from favourites');
        } else {
            updated = [...favourites, hallId];
            toast.success('Added to favourites');
        }
        setFavourites(updated);
        localStorage.setItem('favourite_theatres', JSON.stringify(updated));
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

    const getShowStatus = (showId) => {
        const val = parseInt(showId) || (showId ? showId.charCodeAt(0) : 0);
        return (val % 4 === 0) ? 'fast-filling' : 'available';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background page-enter">
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
        if (!district && !state) {
            return (
                <>
                    <div className="min-h-screen bg-background page-enter flex items-center justify-center">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-16 text-center max-w-md">
                            <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
                                <MapPin className="w-10 h-10" />
                            </div>
                            <h2 className="text-2xl font-extrabold mb-3 tracking-tight">Set Your Location</h2>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-8">Please set your location to see theatres near you.</p>
                            <button
                                onClick={() => setLocationModalOpen(true)}
                                className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover-lift transition-all shadow-md shadow-primary/20 custom-hover cursor-pointer"
                            >
                                Select City
                            </button>
                        </div>
                    </div>
                    <LocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
                </>
            );
        }
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Movie not found</p>
            </div>
        );
    }

    return (
        <>
            <div className="min-h-screen bg-background page-enter">

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
                    <div className="hidden absolute top-4 left-4 sm:left-6 lg:left-14 z-10">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 bg-secondary/80 hover:bg-secondary border border-border/50 text-foreground rounded-xl transition-all duration-300 hover-lift custom-hover cursor-pointer flex items-center justify-center shadow-sm"
                            aria-label="Go back"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    {/* Layer 3: Content */}
                    <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-14 pb-8 pt-16 flex gap-6 items-end">

                        {/* Poster thumbnail — hidden on mobile */}
                        <div className="hidden sm:block flex-shrink-0 w-36 md:w-44">
                            <img
                                src={movie.poster_url}
                                alt={movie.title}
                                className="w-full rounded-xl shadow-2xl object-cover aspect-[2/3] border border-border/40"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                        </div>

                        {/* Movie info */}
                        <div className="flex-1 min-w-0">
                            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-3 leading-tight tracking-tight">
                                {movie.title}
                            </h1>

                            {/* Tag pills */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                {movie.duration_mins && (
                                    <span className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-bold border border-secondary shadow-sm">
                                        Movie runtime: {formatDuration(movie.duration_mins)}
                                    </span>
                                )}
                                {movie.genre?.map((g, i) => (
                                    <span key={i} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold border border-primary/10">
                                        {g}
                                    </span>
                                ))}
                                {movie.language?.map((lang, i) => (
                                    <span key={i} className="px-3 py-1 border border-border text-muted-foreground rounded-full text-xs font-semibold">
                                        {lang}
                                    </span>
                                ))}
                            </div>

                            {/* Description */}
                            {movie.description && (
                                <div className="max-w-3xl">
                                    <p className={`text-sm text-muted-foreground leading-relaxed ${descExpanded ? '' : 'line-clamp-3'}`}>
                                        {movie.description}
                                    </p>
                                    <button
                                        onClick={() => setDescExpanded(!descExpanded)}
                                        className="text-xs font-bold text-primary mt-2 hover:underline focus:outline-none cursor-pointer"
                                    >
                                        {descExpanded ? 'Show less' : 'Read more'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Section 2: Date Selector + Language Chip */}
                <div className="border-b border-border bg-card/30 sticky top-0 z-20 backdrop-blur-md">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14">
                        <div className="flex items-center justify-between gap-4 py-3">

                            {/* Scrollable date buttons */}
                            <div className="flex gap-2 overflow-x-auto pb-1 flex-1 min-w-0 no-scrollbar">
                                {getNextDates().map((date, index) => {
                                    const { dow, day, month } = formatDateParts(date);
                                    const isSelected = date.toDateString() === selectedDate.toDateString();
                                    return (
                                        <button
                                            key={index}
                                            onClick={() => setSelectedDate(date)}
                                            className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-2.5 rounded-xl transition-all duration-300 hover-lift cursor-pointer ${
                                                isSelected
                                                    ? 'bg-gradient-to-br from-primary to-[oklch(from_var(--primary)_l_calc(c*0.7)_h)] text-primary-foreground shadow-md shadow-primary/20 scale-102 font-bold border border-primary'
                                                    : 'border border-border/60 bg-card/50 text-foreground hover:border-primary/50 hover:text-primary'
                                            }`}
                                        >
                                            <span className={`text-[9px] font-bold tracking-wider leading-none uppercase ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{dow}</span>
                                            <span className="text-lg font-extrabold leading-tight my-0.5">{day}</span>
                                            <span className={`text-[9px] font-bold tracking-wider leading-none uppercase ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>{month}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Language chip */}
                            <div className="flex-shrink-0">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-card/50 rounded-xl text-xs font-bold text-muted-foreground whitespace-nowrap shadow-sm">
                                    {movie.language?.[0] ?? 'Original'}
                                    <span className="opacity-40">•</span>
                                    2D
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 3: Subtitle hint + Availability Legend */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4 flex justify-between items-center text-xs font-semibold tracking-wide text-muted-foreground">
                    <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider hidden sm:inline">
                        Language shown indicates audio; subtitle language may vary.
                    </span>
                    <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider sm:hidden">
                        Show Schedule
                    </span>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-success">
                            <span className="w-2.5 h-2.5 rounded-full bg-success inline-block shadow-[0_0_6px_var(--success)] animate-pulse"></span>
                            AVAILABLE
                        </span>
                        <span className="flex items-center gap-1.5 text-warning">
                            <span className="w-2.5 h-2.5 rounded-full bg-warning inline-block shadow-[0_0_6px_var(--warning)] animate-pulse"></span>
                            FAST FILLING
                        </span>
                    </div>
                </div>

                {/* Section 4: Cinema Hall Cards */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 pb-16">
                    {refetching ? (
                        <div className="space-y-6 animate-pulse">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="bg-card/30 border border-border/80 rounded-2xl overflow-hidden shadow-sm backdrop-blur-sm">
                                    <div className="px-5 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-muted rounded-xl"></div>
                                            <div>
                                                <div className="h-4 bg-muted rounded-md w-40 mb-2"></div>
                                                <div className="h-3 bg-muted rounded-md w-28"></div>
                                            </div>
                                        </div>
                                        <div className="h-8 w-24 bg-muted rounded-xl"></div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex gap-2.5">
                                            <div className="h-12 w-20 bg-muted rounded-xl"></div>
                                            <div className="h-12 w-20 bg-muted rounded-xl"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : cinemaHalls.length === 0 ? (
                        <div className="bg-card/30 border border-border/80 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-sm backdrop-blur-sm mt-8">
                            <div className="w-16 h-16 bg-muted/40 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Film className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-extrabold mb-1.5 tracking-tight text-foreground">No Shows Available</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed mb-6">There are no showtimes scheduled for this date in {district}. Try selecting a different date from the bar above.</p>
                            <div className="flex gap-2 justify-center flex-wrap">
                                {getNextDates().slice(1, 5).map((date, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedDate(date)}
                                        className="px-3.5 py-2 border border-border bg-card/50 text-xs font-semibold rounded-lg hover:border-primary hover:text-primary transition-all cursor-pointer"
                                    >
                                        {date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {cinemaHalls.map((hall) => {
                                const isFav = favourites.includes(hall.cinema_hall_id);
                                return (
                                    <div 
                                        key={hall.cinema_hall_id} 
                                        className="bg-card/30 border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-300 backdrop-blur-sm"
                                    >
                                        {/* Hall Header */}
                                        <div className="px-5 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h2 className="font-extrabold text-base sm:text-lg text-foreground leading-tight truncate">{hall.cinema_hall_name}</h2>
                                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{hall.cinema_hall_location}</p>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => {
                                                        const url = hall.latitude && hall.longitude
                                                            ? `https://www.google.com/maps/dir/?api=1&destination=${hall.latitude},${hall.longitude}`
                                                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hall.cinema_hall_name + ' ' + hall.cinema_hall_location)}`
                                                        window.open(url, '_blank', 'noopener,noreferrer')
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-primary border border-primary/20 rounded-xl hover:bg-primary/10 transition-all hover-lift custom-hover cursor-pointer"
                                                    aria-label="Get directions"
                                                    title="Get directions in Google Maps"
                                                >
                                                    <Compass className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Directions</span>
                                                </button>
                                                <button
                                                    onClick={() => toggleFavourite(hall.cinema_hall_id)}
                                                    className="p-2 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                                                    aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                                                >
                                                    <Heart className={`w-5 h-5 transition-all duration-200 ${isFav ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Shows */}
                                        <div className="p-5 sm:p-6">
                                            {hall.shows && hall.shows.length > 0 ? (
                                                <div className="space-y-3">
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {[...hall.shows]
                                                            .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                                            .map((show) => {
                                                                const status = getShowStatus(show.show_id);
                                                                const isFastFilling = status === 'fast-filling';
                                                                return (
                                                                    <button
                                                                        key={show.show_id}
                                                                        onClick={() => navigate(`/show/${show.show_id}`)}
                                                                        className={`flex flex-col items-center justify-center px-4 py-2 min-w-[80px] rounded-xl border transition-all duration-200 hover-lift hover:scale-102 cursor-pointer ${
                                                                            isFastFilling
                                                                                ? 'border-warning/30 bg-warning/5 text-warning hover:border-primary hover:text-primary hover:bg-primary/5'
                                                                                : 'border-success/30 bg-success/5 text-success hover:border-primary hover:text-primary hover:bg-primary/5'
                                                                        }`}
                                                                    >
                                                                        <span className="font-extrabold text-xs tracking-tight">
                                                                            {show.start_time ? formatTime(show.start_time) : '--:--'}
                                                                        </span>
                                                                        <span className="text-[9px] text-muted-foreground font-semibold leading-none mt-1 text-center">
                                                                            {show.screen_name} · {show.language_version}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })
                                                        }
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground/80 mt-3 font-semibold uppercase tracking-wider">Non-cancellable</p>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">No shows available</p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <LocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
        </>
    );
};

export default MovieDetailsPage;
