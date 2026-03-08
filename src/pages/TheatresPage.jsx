import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';

const TheatresPage = () => {
    const navigate = useNavigate();
    const { district, state } = useCustomerAuth();

    const [cinemaHalls, setCinemaHalls] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

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
        for (let i = 0; i < 6; i++) {
            const date = new Date();
            date.setDate(date.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const formatDateLabel = (date) => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';

        return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    };

    if (!district || !state) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-16 text-center">
                    <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-2">Set Your Location</h2>
                    <p className="text-muted-foreground">Please set your location to see theatres near you.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="flex gap-3">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="h-12 w-24 bg-secondary rounded-lg"></div>
                            ))}
                        </div>
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="bg-card border border-border rounded-lg p-6 space-y-4">
                                <div className="h-6 bg-secondary rounded w-1/4"></div>
                                <div className="h-4 bg-secondary rounded w-1/3"></div>
                                <div className="h-24 bg-secondary rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-1">Theatres</h1>
                    <p className="text-muted-foreground text-sm">{district}, {state}</p>
                </div>

                {/* Date Selector */}
                <div className="mb-8">
                    <div className="flex gap-3 overflow-x-auto pb-2">
                        {getNextDates().map((date, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedDate(date)}
                                className={`px-6 py-3 rounded-lg whitespace-nowrap transition ${date.toDateString() === selectedDate.toDateString()
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                    }`}
                            >
                                {formatDateLabel(date)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Cinema Halls */}
                {cinemaHalls.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-12 text-center">
                        <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                        </svg>
                        <p className="text-muted-foreground text-lg">No shows available for this date in {district}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cinemaHalls.map((hall) => (
                            <div key={hall.hall_id} className="bg-card border border-border rounded-lg overflow-hidden">
                                {/* Hall Header */}
                                <div className="px-6 py-4 border-b border-border flex items-center gap-3">
                                    <svg className="w-5 h-5 text-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                    <div>
                                        <h2 className="text-lg font-semibold">{hall.hall_name}</h2>
                                        <p className="text-sm text-muted-foreground">{hall.location}</p>
                                    </div>
                                </div>

                                {/* Movies in this hall */}
                                <div className="divide-y divide-border">
                                    {hall.movies.map((movie) => (
                                        <div key={movie.movie_id} className="p-6">
                                            <div className="flex gap-4">
                                                {/* Poster thumbnail */}
                                                <img
                                                    src={movie.poster_url}
                                                    alt={movie.title}
                                                    className="w-16 h-24 object-cover rounded shrink-0"
                                                />

                                                {/* Movie info + showtimes */}
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-semibold text-base mb-1">{movie.title}</h3>

                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground mb-3">
                                                        <span className="flex items-center gap-1">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            {movie.duration_mins} mins
                                                        </span>
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
                                                            <div key={screenName} className="flex items-center gap-3 flex-wrap">
                                                                <span className="text-xs text-muted-foreground w-20 shrink-0">{screenName}</span>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {shows.map((show) => (
                                                                        <button
                                                                            key={show.show_id}
                                                                            onClick={() => navigate(`/show/${show.show_id}`)}
                                                                            className="px-4 py-2 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition text-sm font-medium"
                                                                        >
                                                                            {formatTime(show.start_time)}
                                                                            {show.language_version && (
                                                                                <span className="ml-1.5 text-xs opacity-75">
                                                                                    ({show.language_version})
                                                                                </span>
                                                                            )}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
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
