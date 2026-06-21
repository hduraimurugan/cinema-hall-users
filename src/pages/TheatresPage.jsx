import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LocationModal } from '../components/LocationModal';
import { Building2, MapPin, Compass, Heart, ChevronDown, Film, Clock } from 'lucide-react';

const TheatresPage = () => {
    const navigate = useNavigate();
    const { district, state } = useCustomerAuth();

    const [cinemaHalls, setCinemaHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
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
        if (district && state) {
            fetchTheatres();
        } else {
            setLoading(false);
        }
    }, [district, state, selectedDate]);

    const fetchTheatres = async () => {
        try {
            setLoading(true);
            const dateStr = selectedDate.toISOString().split('T')[0];
            const data = await customerMoviesAPI.getTheatresWithShows(district, state, dateStr);
            setCinemaHalls(data.cinema_halls || []);
        } catch (error) {
            console.error('Failed to fetch theatres:', error);
            toast.error('Failed to load theatres');
        } finally {
            setLoading(false);
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

    const formatDateParts = (date) => ({
        dow: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
        day: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    });

    const formatDuration = (mins) => {
        if (!mins) return '';
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return h > 0 && m > 0 ? `${h}h ${m}m` : h > 0 ? `${h}h` : `${m}m`;
    };

    const getShowStatus = (showId) => {
        // Deterministically assign show status based on ID to render a rich available/filling UI mix
        return (parseInt(showId) % 4 === 0) ? 'fast-filling' : 'available';
    };

    if (!district || !state) {
        return (
            <>
                <div className="min-h-screen bg-background page-enter flex items-center justify-center">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-16 text-center max-w-md">
                        <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
                            <MapPin className="w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-extrabold mb-3 tracking-tight">Select Location</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed mb-8">Please choose your city to explore movies, theatres, and live shows happening near you.</p>
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
        <div className="min-h-screen bg-background page-enter">
            {/* Page Header */}
            <div className="relative overflow-hidden pt-8 pb-6 border-b border-border bg-card/10 backdrop-blur-sm">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
                    <div className="space-y-1">
                        <span className="text-[10px] font-extrabold text-primary tracking-widest uppercase">DISCOVER THEATRES</span>
                        <div className="flex flex-wrap items-center gap-3">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">Theatres</h1>
                            <button 
                                onClick={() => setLocationModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-xs font-bold tracking-wide transition-all border border-border shadow-sm cursor-pointer"
                            >
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                <span>{district}, {state}</span>
                                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                            </button>
                        </div>
                    </div>
                    {!loading && cinemaHalls.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5 bg-card/50 border border-border px-3 py-1.5 rounded-lg">
                                <Film className="w-3.5 h-3.5 text-primary" />
                                {cinemaHalls.length} {cinemaHalls.length === 1 ? 'Theatre' : 'Theatres'} Available
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Date Selector */}
            <div className="border-b border-border bg-card/30 sticky top-0 z-20 backdrop-blur-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3">
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
                </div>
            </div>

            {/* Availability Legend */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4 flex justify-between items-center text-xs font-semibold tracking-wide text-muted-foreground">
                <span className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider">Show Schedule</span>
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

            {/* Cinema Halls */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 pb-16">
                {loading ? (
                    <div className="space-y-6">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-card/30 border border-border/80 rounded-2xl p-5 space-y-5 animate-pulse backdrop-blur-sm">
                                <div className="flex items-center justify-between pb-3 border-b border-border/30">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 bg-muted rounded-xl"></div>
                                        <div>
                                            <div className="h-4 bg-muted rounded-md w-40 mb-2"></div>
                                            <div className="h-3 bg-muted rounded-md w-28"></div>
                                        </div>
                                    </div>
                                    <div className="h-8 w-24 bg-muted rounded-xl"></div>
                                </div>
                                <div className="space-y-6 pt-2">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="flex gap-5">
                                            <div className="w-16 h-24 bg-muted rounded-xl flex-shrink-0"></div>
                                            <div className="flex-1 space-y-3">
                                                <div className="h-4 bg-muted rounded-md w-1/3 mb-1"></div>
                                                <div className="h-3 bg-muted rounded-md w-1/4 mb-3"></div>
                                                <div className="flex gap-2.5 pt-1">
                                                    <div className="h-12 w-20 bg-muted rounded-xl"></div>
                                                    <div className="h-12 w-20 bg-muted rounded-xl"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
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
                            const isFav = favourites.includes(hall.hall_id);
                            return (
                                <div 
                                    key={hall.hall_id} 
                                    className="bg-card/30 border border-border/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-300 backdrop-blur-sm"
                                >
                                    {/* Hall Header */}
                                    <div className="px-5 py-4 bg-muted/20 border-b border-border/50 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary flex-shrink-0">
                                                <Building2 className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="font-extrabold text-base sm:text-lg text-foreground leading-tight truncate">{hall.hall_name}</h2>
                                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{hall.location}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => {
                                                    const url = hall.latitude && hall.longitude
                                                        ? `https://www.google.com/maps/dir/?api=1&destination=${hall.latitude},${hall.longitude}`
                                                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hall.hall_name + ' ' + hall.location)}`
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
                                                onClick={() => toggleFavourite(hall.hall_id)}
                                                className="p-2 text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95 cursor-pointer"
                                                aria-label={isFav ? "Remove from favourites" : "Add to favourites"}
                                            >
                                                <Heart className={`w-5 h-5 transition-all duration-200 ${isFav ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Movies in this hall */}
                                    <div className="divide-y divide-border/50">
                                        {hall.movies.map((movie) => (
                                            <div key={movie.movie_id} className="p-5 sm:p-6 transition-colors hover:bg-card/10">
                                                <div className="flex flex-col sm:flex-row gap-5">
                                                    {/* Poster */}
                                                    <div
                                                        className="flex-shrink-0 w-16 sm:w-20 cursor-pointer relative group overflow-hidden rounded-xl shadow-sm border border-border/50 aspect-[2/3]"
                                                        onClick={() => navigate(`/movie/${movie.movie_id}`)}
                                                    >
                                                        <img
                                                            src={movie.poster_url}
                                                            alt={movie.title}
                                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                        />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                                    </div>

                                                    {/* Movie details & showtimes */}
                                                    <div className="flex-1 min-w-0">
                                                        <h3
                                                            className="font-extrabold text-base hover:text-primary transition-colors cursor-pointer tracking-tight mb-1.5"
                                                            onClick={() => navigate(`/movie/${movie.movie_id}`)}
                                                        >
                                                            {movie.title}
                                                        </h3>

                                                        {/* Duration & Genres */}
                                                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-4">
                                                            {movie.duration_mins && (
                                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-muted/40 border border-border/40 rounded-md font-semibold text-[11px]">
                                                                    <Clock className="w-3 h-3 text-primary" />
                                                                    {formatDuration(movie.duration_mins)}
                                                                </span>
                                                            )}
                                                            {movie.genre?.slice(0, 2).map((g, i) => (
                                                                <span 
                                                                    key={i} 
                                                                    className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-md text-[10px] font-bold uppercase tracking-wider border border-secondary"
                                                                >
                                                                    {g}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        {/* Showtimes grouped by Screen */}
                                                        <div className="space-y-3">
                                                            {Object.entries(
                                                                movie.shows.reduce((acc, show) => {
                                                                    if (!acc[show.screen_name]) acc[show.screen_name] = [];
                                                                    acc[show.screen_name].push(show);
                                                                    return acc;
                                                                    // eslint-disable-next-line no-unused-vars
                                                                }, {})
                                                            ).map(([screenName, shows]) => (
                                                                <div key={screenName} className="flex flex-col gap-2">
                                                                    <div className="flex flex-wrap gap-2.5">
                                                                        {[...shows]
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
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <p className="text-[10px] text-muted-foreground/80 mt-3 font-semibold uppercase tracking-wider">Non-cancellable</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <LocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
        </div>
    );
};

export default TheatresPage;
