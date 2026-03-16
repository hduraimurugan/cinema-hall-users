import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showsAPI, bookingAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LoginModal } from '../components/LoginModal';

const SeatSelectionPage = () => {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { customer } = useCustomerAuth();

    const [showData, setShowData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        fetchShowDetails();
    }, [showId]);

    const fetchShowDetails = async () => {
        try {
            setLoading(true);
            const data = await showsAPI.getShowById(showId);
            setShowData(data);
        } catch (error) {
            console.error('Failed to fetch show details:', error);
            toast.error('Failed to load seat layout');
        } finally {
            setLoading(false);
        }
    };

    const getSeatPrice = (seatType) => {
        if (!showData) return 0;
        const priceOverride = showData.show_details?.price_override;
        const layout = showData.screen?.layout;
        if (priceOverride && priceOverride[seatType]) return parseInt(priceOverride[seatType]) || 0;
        if (layout?.pricing?.[seatType]) return parseInt(layout.pricing[seatType]) || 0;
        return 0;
    };

    const calculateTotal = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === seatId);
            return total + (getSeatPrice(seat?.type) || 0);
        }, 0);
    };

    const getSeatLabels = () => {
        return selectedSeats.map(id => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === id);
            return seat?.seat_label || id;
        }).filter(Boolean);
    };

    const toggleSeat = (seat) => {
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') return;
        setSelectedSeats(prev =>
            prev.includes(seat.id) ? prev.filter(id => id !== seat.id) : [...prev, seat.id]
        );
    };

    const handleProceed = async () => {
        if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat');
            return;
        }
        if (!customer) {
            setLoginOpen(true);
            return;
        }

        try {
            setIsProcessing(true);
            const result = await bookingAPI.holdSeats(showId, selectedSeats);

            if (result.success) {
                toast.success(`${selectedSeats.length} seat(s) held for 5 minutes`);
                navigate('/order-summary', {
                    state: {
                        showId,
                        selectedSeats,
                        seatLabels: getSeatLabels(),
                        holdExpiry: result.hold_expires_at,
                        totalAmount: calculateTotal(),
                        movieTitle: showData.movie?.title,
                        language: showData.movie?.language?.join(', ') || 'Tamil',
                        showDate: showData.show_details?.show_date,
                        startTime: showData.show_details?.start_time,
                        screenName: showData.screen?.name,
                        screenType: showData.screen?.screen_type || '2D',
                        cinemaName: showData.cinema_hall?.name || showData.screen?.name,
                    }
                });
            }
        } catch (error) {
            console.error('Failed to hold seats:', error);
            toast.error(error?.message || 'Failed to hold seats. They may be taken.');
            setSelectedSeats([]);
            fetchShowDetails();
        } finally {
            setIsProcessing(false);
        }
    };

    // Theme-adaptive seat colors
    const getSeatClasses = (seat) => {
        if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') {
            return 'invisible pointer-events-none';
        }
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') {
            return 'bg-gray-300 dark:bg-zinc-700 text-gray-400 dark:text-zinc-500 cursor-not-allowed border border-gray-300 dark:border-zinc-700';
        }
        if (selectedSeats.includes(seat.id)) {
            return 'bg-green-500 border border-green-500 text-white cursor-pointer shadow-sm';
        }
        return 'bg-transparent border border-gray-400 dark:border-zinc-500 text-gray-600 dark:text-zinc-300 hover:border-gray-700 dark:hover:border-zinc-300 cursor-pointer';
    };

    const generateSeatsByCategory = () => {
        if (!showData?.screen?.layout?.seats) return { premium: [], gold: [], silver: [] };
        const seats = showData.screen.layout.seats;
        return {
            premium: seats.filter(seat => seat.type === 'premium'),
            gold: seats.filter(seat => seat.type === 'gold'),
            silver: seats.filter(seat => seat.type === 'silver'),
        };
    };

    const renderSeatSection = (seats, sectionTitle, price) => {
        if (!seats.length) return null;

        const aisleAfterColumns = showData?.screen?.layout?.aisleAfterColumns || [];
        const aisleAfterRows = showData?.screen?.layout?.aisleAfterRows || [];

        const seatsByRow = seats.reduce((acc, seat) => {
            const row = seat.seat_label?.charAt(0) || 'A';
            if (!acc[row]) acc[row] = [];
            acc[row].push(seat);
            return acc;
        }, {});

        const sortedRows = Object.keys(seatsByRow).sort();

        return (
            <div className="mb-10">
                <div className="text-center mb-4">
                    <span className="text-[11px] font-semibold text-gray-500 dark:text-zinc-400 tracking-widest uppercase">
                        ₹{price} {sectionTitle}
                    </span>
                </div>
                <div className="space-y-1.5">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center gap-1">
                                {/* Left row label */}
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">
                                    {row}
                                </div>
                                {seatsByRow[row]
                                    .sort((a, b) => {
                                        const aNum = parseInt(a.seat_label?.slice(1) || '0');
                                        const bNum = parseInt(b.seat_label?.slice(1) || '0');
                                        return aNum - bNum;
                                    })
                                    .map((seat) => {
                                        const colNum = parseInt(seat.seat_label?.slice(1) || '0');
                                        const hasAisleAfter = aisleAfterColumns.includes(colNum);
                                        const colLabel = String(colNum).padStart(2, '0');
                                        return (
                                            <React.Fragment key={seat.id}>
                                                <button
                                                    onClick={() => toggleSeat(seat)}
                                                    disabled={seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD'}
                                                    className={`w-7 h-7 text-[10px] font-medium rounded-sm transition-colors duration-150 flex-shrink-0 ${getSeatClasses(seat)}`}
                                                    title={`${seat.seat_label} - ₹${price}`}
                                                >
                                                    {colLabel}
                                                </button>
                                                {hasAisleAfter && <div className="w-3 sm:w-4 flex-shrink-0" aria-hidden="true" />}
                                            </React.Fragment>
                                        );
                                    })}
                                {/* Right row label */}
                                <div className="w-5 text-center text-[10px] text-gray-400 dark:text-zinc-500 flex-shrink-0 select-none">
                                    {row}
                                </div>
                            </div>
                            {aisleAfterRows.includes(row) && <div className="h-3" aria-hidden="true" />}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">Loading seat layout...</p>
                </div>
            </div>
        );
    }

    if (!showData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center text-muted-foreground">Show not found</p>
            </div>
        );
    }

    const categorizedSeats = generateSeatsByCategory();
    const screenPosition = showData?.screen?.layout?.screenPosition || 'bottom';

    const screenIndicator = (
        <div className="my-8 px-4">
            <div className="h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full" />
            <p className="text-center text-[10px] font-semibold tracking-[0.3em] text-blue-500 dark:text-blue-400 uppercase mt-2">
                All Eyes This Way
            </p>
        </div>
    );

    const seatLayout = (
        <div>
            {renderSeatSection(categorizedSeats.premium, 'Premium', getSeatPrice('premium'))}
            {renderSeatSection(categorizedSeats.gold, 'Gold', getSeatPrice('gold'))}
            {renderSeatSection(categorizedSeats.silver, 'Silver', getSeatPrice('silver'))}
        </div>
    );

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Sticky Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-3 sm:px-6 lg:px-14 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-1.5 sm:p-2 hover:bg-secondary rounded-md transition flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        {showData.movie?.poster_url && (
                            <div className="h-14 w-10 sm:h-16 sm:w-11 rounded overflow-hidden flex-shrink-0 bg-muted border border-border">
                                <img
                                    src={showData.movie.poster_url}
                                    alt={showData.movie.title}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-semibold leading-tight truncate">
                                {showData.movie?.title}
                                <span className="text-xs font-normal text-muted-foreground ml-1.5 hidden sm:inline">
                                    ({showData.movie?.language?.join(', ') || 'Tamil'})
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground truncate">
                                {showData.cinema_hall?.name || showData.screen?.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                <span className="bg-blue-600 text-white text-[11px] px-2 py-0.5 rounded font-medium">
                                    {showData.show_details?.start_time}
                                </span>
                                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                    {showData.show_details?.show_date}
                                </span>
                                <span className="text-[11px] border border-border rounded px-1.5 py-0.5">
                                    {showData.screen?.screen_type || '2D'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seat Layout Area */}
            <div className="py-4 sm:py-6 px-2 sm:px-4 lg:px-14">
                <div className="bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl sm:rounded-2xl overflow-hidden">

                    {/* Legend */}
                    <div className="flex justify-center gap-5 sm:gap-8 pt-5 pb-2 text-[11px] sm:text-xs text-gray-500 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm border border-gray-400 dark:border-zinc-500" />
                            <span>Available</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-gray-300 dark:bg-zinc-700 border border-gray-300 dark:border-zinc-700" />
                            <span>Sold</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-sm bg-green-500" />
                            <span>Selected</span>
                        </div>
                    </div>

                    {/* Scrollable seat grid — scrolls horizontally on small screens */}
                    <div className="overflow-x-auto overflow-y-visible pb-6 pt-2">
                        <div className="w-max mx-auto px-4 sm:px-8">
                            {screenPosition === 'top' ? (
                                <>{screenIndicator}{seatLayout}</>
                            ) : (
                                <>{seatLayout}{screenIndicator}</>
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom payment bar */}
            {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-2xl z-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                {selectedSeats.length} Ticket{selectedSeats.length > 1 ? 's' : ''}
                            </p>
                            <p className="text-lg font-bold leading-tight">₹{calculateTotal()}</p>
                        </div>
                        <button
                            onClick={handleProceed}
                            disabled={isProcessing}
                            className="bg-red-600 hover:bg-red-700 active:bg-red-800 disabled:opacity-50 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold text-sm transition"
                        >
                            {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                        </button>
                    </div>
                </div>
            )}

            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
    );
};

export default SeatSelectionPage;
