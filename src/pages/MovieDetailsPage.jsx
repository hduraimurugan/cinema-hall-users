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
    const [selectedDate, setSelectedDate] = useState(new Date());

    useEffect(() => {
        fetchMovieShowtimes();
    }, [movieId, selectedDate]);

    const fetchMovieShowtimes = async () => {
        try {
            setLoading(true);

            const data = await customerMoviesAPI.getMovieDetailsWithShowtimes(movieId, district, state);
            setMovie(data.movie);
            setCinemaHalls(data.cinema_halls || []);
        } catch (error) {
            console.error('Failed to fetch movie showtimes:', error);
            toast.error('Failed to load showtimes');
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

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse">
                    <div className="h-96 bg-gray-200 rounded-lg mb-6"></div>
                    <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2"></div>
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
            {/* Back Button */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back
                </button>
            </div>

            {/* Movie Header */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="grid md:grid-cols-[300px_1fr] gap-8">
                    {/* Poster */}
                    <div className="relative">
                        <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-full rounded-lg shadow-lg object-cover"
                        />
                    </div>

                    {/* Movie Info */}
                    <div>
                        <h1 className="text-4xl font-bold mb-4">{movie.title}</h1>

                        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                            {movie.genre?.map((g, i) => (
                                <span key={i} className="px-3 py-1 bg-secondary rounded-full">
                                    {g}
                                </span>
                            ))}
                        </div>

                        <div className="flex items-center gap-6 text-muted-foreground mb-6">
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {movie.duration_mins} mins
                            </div>
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                                {movie.language?.join(', ')}
                            </div>
                        </div>

                        <p className="text-muted-foreground leading-relaxed">
                            {movie.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Date Selector */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <h2 className="text-2xl font-bold mb-4">Select Date</h2>
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

            {/* Cinema Halls & Showtimes */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <h2 className="text-2xl font-bold mb-6">Select Cinema & Show Time</h2>

                {cinemaHalls.length === 0 ? (
                    <div className="bg-card border border-border rounded-lg p-8 text-center">
                        <p className="text-muted-foreground">No shows available for this date</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {cinemaHalls.map((hall) => (
                            <div key={hall.hall_id} className="bg-card border border-border rounded-lg p-6">
                                <div className="flex items-start gap-3 mb-4">
                                    <svg className="w-6 h-6 text-primary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                                    </svg>
                                    <div>
                                        <h3 className="text-xl font-semibold">{hall.hall_name}</h3>
                                        <p className="text-sm text-muted-foreground">{hall.location}</p>
                                    </div>
                                </div>

                                {hall.shows && hall.shows.length > 0 ? (
                                    <div className="space-y-3">
                                        {/* Group shows by screen */}
                                        {Object.entries(
                                            hall.shows.reduce((acc, show) => {
                                                if (!acc[show.screen_name]) acc[show.screen_name] = [];
                                                acc[show.screen_name].push(show);
                                                return acc;
                                            }, {})
                                        ).map(([screenName, shows]) => (
                                            <div key={screenName}>
                                                <p className="text-sm text-muted-foreground mb-2">{screenName}</p>
                                                <div className="flex flex-wrap gap-3">
                                                    {shows.map((show) => (
                                                        <button
                                                            key={show.show_id}
                                                            onClick={() => navigate(`/show/${show.show_id}`)}
                                                            className="px-6 py-3 bg-secondary hover:bg-primary hover:text-primary-foreground rounded-lg transition font-medium"
                                                        >
                                                            {formatTime(show.start_time)}
                                                            {show.language_version && (
                                                                <span className="ml-2 text-xs opacity-75">
                                                                    ({show.language_version})
                                                                </span>
                                                            )}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
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
