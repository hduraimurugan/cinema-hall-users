import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LocationModal } from '../components/LocationModal';

const TheatresPage = () => {
    const navigate = useNavigate();
    const { district, state } = useCustomerAuth();

    const [cinemaHalls, setCinemaHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [locationModalOpen, setLocationModalOpen] = useState(false);

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

    if (!district || !state) {
        return (
            <>
                <div className="min-h-screen bg-background">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-16 text-center">
                        <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <h2 className="text-2xl font-bold mb-2">Set Your Location</h2>
                        <p className="text-muted-foreground">Please set your location to see theatres near you.</p>
                        <button
                            onClick={() => setLocationModalOpen(true)}
                            className="px-6 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 transition-colors text-sm mt-5"
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
        <div className="min-h-screen bg-background">

            {/* Page Header */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 pt-6 pb-4">
                <h1 className="text-3xl font-bold">Theatres</h1>
                <p className="text-sm text-muted-foreground mt-1">{district}, {state}</p>
            </div>

            {/* Date Selector */}
            <div className="bg-card border-b border-border">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14">
                    <div className="flex items-center gap-4 py-3">
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
                    </div>
                </div>
            </div>

            {/* Availability Legend */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-2">
                <div className="flex items-center justify-end gap-4 text-xs font-semibold tracking-wide">
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

            {/* Cinema Halls */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 pb-10">
                {loading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-5 w-5 bg-muted rounded"></div>
                                        <div>
                                            <div className="h-4 bg-muted rounded w-40 mb-1"></div>
                                            <div className="h-3 bg-muted rounded w-28"></div>
                                        </div>
                                    </div>
                                    <div className="h-5 w-5 bg-muted rounded-full"></div>
                                </div>
                                <div className="border-t border-border pt-4 space-y-4">
                                    {[1, 2].map((j) => (
                                        <div key={j} className="flex gap-4">
                                            <div className="w-14 h-20 bg-muted rounded-lg flex-shrink-0"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-muted rounded w-1/3"></div>
                                                <div className="h-3 bg-muted rounded w-1/4"></div>
                                                <div className="flex gap-2 pt-1">
                                                    <div className="h-12 w-20 bg-muted rounded-lg"></div>
                                                    <div className="h-12 w-20 bg-muted rounded-lg"></div>
                                                </div>
                                            </div>
                                        </div>
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
                        <p className="text-muted-foreground font-medium">No shows available for this date in {district}</p>
                        <p className="text-xs text-muted-foreground mt-1">Try selecting a different date</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {cinemaHalls.map((hall) => (
                            <div key={hall.hall_id} className="bg-card border border-border rounded-xl overflow-hidden">

                                {/* Hall Header */}
                                <div className="px-5 py-4 flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <svg className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-4 8h4" />
                                        </svg>
                                        <div>
                                            <h2 className="font-bold text-base text-foreground leading-tight">{hall.hall_name}</h2>
                                            <p className="text-xs text-muted-foreground mt-0.5">{hall.location}</p>
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

                                {/* Movies in this hall */}
                                <div className="divide-y divide-border">
                                    {hall.movies.map((movie) => (
                                        <div key={movie.movie_id} className="px-5 py-4">
                                            <div className="flex gap-4">

                                                {/* Poster */}
                                                <div
                                                    className="flex-shrink-0 w-14 cursor-pointer"
                                                    onClick={() => navigate(`/movie/${movie.movie_id}`)}
                                                >
                                                    <img
                                                        src={movie.poster_url}
                                                        alt={movie.title}
                                                        className="w-full rounded-lg object-cover aspect-[2/3] shadow-md"
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                                    />
                                                </div>

                                                {/* Movie info + showtimes */}
                                                <div className="flex-1 min-w-0">
                                                    <h3
                                                        className="font-semibold text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
                                                        onClick={() => navigate(`/movie/${movie.movie_id}`)}
                                                    >
                                                        {movie.title}
                                                    </h3>

                                                    {/* Duration + genres */}
                                                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground mb-3">
                                                        {movie.duration_mins && (
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                                {formatDuration(movie.duration_mins)}
                                                            </span>
                                                        )}
                                                        {movie.genre?.slice(0, 2).map((g, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-secondary rounded-full">{g}</span>
                                                        ))}
                                                    </div>

                                                    {/* Shows grouped by screen */}
                                                    <div className="space-y-2">
                                                        {Object.entries(
                                                            movie.shows.reduce((acc, show) => {
                                                                if (!acc[show.screen_name]) acc[show.screen_name] = [];
                                                                acc[show.screen_name].push(show);
                                                                return acc;
                                                            }, {})
                                                        ).map(([screenName, shows]) => (
                                                            <div key={screenName} className="flex items-start gap-3 flex-wrap">
                                                                {/* <span className="text-xs text-muted-foreground w-24 shrink-0 pt-2.5">{screenName}</span> */}
                                                                <div className="flex flex-wrap gap-2">
                                                                    {[...shows]
                                                                        .sort((a, b) => a.start_time.localeCompare(b.start_time))
                                                                        .map((show) => (
                                                                            <button
                                                                                key={show.show_id}
                                                                                onClick={() => navigate(`/show/${show.show_id}`)}
                                                                                className="flex flex-col items-center justify-center px-3 py-2 min-w-[76px] border border-green-500 rounded-lg text-green-700 dark:text-green-400 hover:border-primary hover:text-primary transition-colors duration-150 cursor-pointer"
                                                                            >
                                                                                <span className="font-bold text-xs leading-tight">
                                                                                    {show.start_time ? formatTime(show.start_time) : '--:--'}
                                                                                </span>
                                                                                <span className="text-[10px] text-muted-foreground leading-tight mt-0.5 text-center">
                                                                                    {show.screen_name} · {show.language_version}
                                                                                </span>
                                                                            </button>
                                                                        ))
                                                                    }
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <p className="text-[10px] text-muted-foreground mt-2">Non-cancellable</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TheatresPage;
