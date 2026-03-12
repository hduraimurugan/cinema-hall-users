import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showsAPI, bookingAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { LoginModal } from '../components/LoginModal';

const SeatSelectionPage = () => {
    const { showId } = useParams();
    const navigate = useNavigate();
    const { customer } = useCustomerAuth();
    const { initiatePayment } = useRazorpayPayment();

    const [showData, setShowData] = useState(null);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [holdExpiry, setHoldExpiry] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [loginOpen, setLoginOpen] = useState(false);

    useEffect(() => {
        fetchShowDetails();
    }, [showId]);

    // Countdown timer
    useEffect(() => {
        if (!holdExpiry) return;

        const interval = setInterval(() => {
            const now = new Date();
            const expiry = new Date(holdExpiry);
            const diff = expiry - now;

            if (diff <= 0) {
                setHoldExpiry(null);
                setTimeLeft(null);
                toast.error('Seat hold expired. Please select again.');
                setSelectedSeats([]);
                fetchShowDetails();
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [holdExpiry]);

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

        if (priceOverride && priceOverride[seatType]) {
            return parseInt(priceOverride[seatType]) || 0;
        }

        if (layout?.pricing?.[seatType]) {
            return parseInt(layout.pricing[seatType]) || 0;
        }

        return 0;
    };

    const calculateTotal = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === seatId);
            return total + (getSeatPrice(seat?.type) || 0);
        }, 0);
    };

    const toggleSeat = (seat) => {
        if (seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD') return;
        if (holdExpiry) return; // Can't change after holding

        console.log("seat", seat);

        setSelectedSeats(prev => {
            if (prev.includes(seat.id)) {
                return prev.filter(id => id !== seat.id);
            } else {
                return [...prev, seat.id];
            }
        });
    };

    const handleHoldSeats = async () => {
        if (selectedSeats.length === 0) {
            toast.error('Please select at least one seat');
            return;
        }

        if (!customer) {
            setLoginOpen(true);
            return;
        }

        console.log("selectedSeats", selectedSeats);

        try {
            setIsProcessing(true);
            const result = await bookingAPI.holdSeats(showId, selectedSeats);

            if (result.success) {
                setHoldExpiry(result.hold_expires_at);
                toast.success(`${selectedSeats.length} seat(s) held for 5 minutes`);
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

    const handleCancelBooking = async () => {
        try {
            await bookingAPI.releaseSeats(showId, selectedSeats);
            setSelectedSeats([]);
            setHoldExpiry(null);
            setTimeLeft(null);
            toast.info('Booking cancelled');
            fetchShowDetails();
        } catch (error) {
            console.error('Failed to release seats:', error);
        }
    };

    const handlePayment = async () => {
        if (!customer) {
            toast.error('Please login to continue');
            return;
        }

        try {
            setIsProcessing(true);
            const total = calculateTotal();

            const result = await initiatePayment({
                show_id: showId,
                seats: selectedSeats,
                amount: total,
                customer: customer
            });

            toast.success('Payment successful! Booking confirmed.');
            navigate(`/booking/success?payment_id=${result.booking.payment_id}`);
        } catch (error) {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getSeatColor = (seat) => {
        const isSelected = selectedSeats.includes(seat.id);

        if (seat.type === 'passage' || seat.isBlocked || seat.status === 'blocked') {
            return 'invisible';
        }

        if (seat.status === 'booked' || seat.status === 'BOOKED') {
            return 'bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        if (seat.status === 'HELD') {
            return 'bg-gray-300 text-gray-500 cursor-not-allowed';
        }

        if (isSelected) {
            return 'bg-green-500 border-green-600 text-white shadow-lg';
        }

        // Available seats - green border with background
        return 'bg-background border-2 border-green-400 hover:border-green-500 cursor-pointer';
    };

    const generateSeatsByCategory = () => {
        if (!showData?.screen?.layout?.seats) return { premium: [], gold: [], silver: [] };

        const seats = showData.screen.layout.seats;
        const categorizedSeats = {
            premium: seats.filter(seat => seat.type === 'premium'),
            gold: seats.filter(seat => seat.type === 'gold'),
            silver: seats.filter(seat => seat.type === 'silver'),
        };

        return categorizedSeats;
    };

    const renderSeatSection = (seats, sectionTitle, price) => {
        if (!seats.length) return null;

        const aisleAfterColumns = showData?.screen?.layout?.aisleAfterColumns || [];
        const aisleAfterRows = showData?.screen?.layout?.aisleAfterRows || [];

        // Group seats by row
        const seatsByRow = seats.reduce((acc, seat) => {
            const row = seat.seat_label?.charAt(0) || 'A';
            if (!acc[row]) acc[row] = [];
            acc[row].push(seat);
            return acc;
        }, {});

        const sortedRows = Object.keys(seatsByRow).sort();

        return (
            <div className="mb-8">
                <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold mb-1">{sectionTitle}</h3>
                    <p className="text-sm text-muted-foreground">₹{price}</p>
                </div>
                <div className="space-y-2">
                    {sortedRows.map((row) => (
                        <React.Fragment key={row}>
                            <div className="flex items-center justify-center gap-1">
                                <div className="w-8 text-center text-sm font-medium mr-2">{row}</div>
                                {seatsByRow[row]
                                    .sort((a, b) => {
                                        const aNum = parseInt(a.seat_label?.slice(1) || '0');
                                        const bNum = parseInt(b.seat_label?.slice(1) || '0');
                                        return aNum - bNum;
                                    })
                                    .map((seat, index) => {
                                        const colNum = parseInt(seat.seat_label?.slice(1) || '0');
                                        const hasAisleAfterCol = aisleAfterColumns.includes(colNum);
                                        return (
                                            <React.Fragment key={seat.id}>
                                                <button
                                                    onClick={() => toggleSeat(seat)}
                                                    disabled={seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD' || holdExpiry}
                                                    className={`
                                                        w-8 h-8 text-xs font-medium rounded transition-all duration-200 transform
                                                        ${getSeatColor(seat)}
                                                        ${(seat.status === 'available' || seat.status === 'AVAILABLE') && !holdExpiry ? 'hover:scale-105' : ''}
                                                        ${selectedSeats.includes(seat.id) ? 'ring-1 ring-green-400' : ''}
                                                    `}
                                                    title={`${seat.seat_label} - ₹${price}`}
                                                >
                                                    {seat.seat_label?.slice(1) || index + 1}
                                                </button>
                                                {hasAisleAfterCol && (
                                                    <div className="w-3" aria-hidden="true" />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                            </div>
                            {aisleAfterRows.includes(row) && (
                                <div className="h-3" aria-hidden="true" />
                            )}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading seat layout...</p>
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

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4">
                    <div className="flex items-center gap-4 mb-4">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 hover:bg-secondary rounded-md transition"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <div className="flex gap-4 items-center flex-1">
                            {/* Movie Poster */}
                            {showData.movie?.poster_url && (
                                <div className="h-20 w-14 rounded-md overflow-hidden flex-shrink-0 bg-muted border border-border">
                                    <img
                                        src={showData.movie.poster_url}
                                        alt={showData.movie.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}

                            {/* Movie Info */}
                            <div className="flex-1">
                                <h1 className="text-lg font-semibold mb-1">
                                    {showData.movie?.title}{' '}
                                    <span className="text-sm font-medium text-muted-foreground">
                                        • {showData.movie?.language?.join(', ') || 'English'}
                                    </span>
                                </h1>
                                <p className="text-sm text-muted-foreground mb-0.5">
                                    📅 {showData.show_details?.show_date}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    🏟️ {showData.screen?.name}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Show Time & Timer */}
                    <div className="flex gap-2 items-center">
                        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                            {showData.show_details?.start_time}
                            <span className="text-xs opacity-80 ml-1">
                                {showData.screen?.screen_type || '2D'}
                            </span>
                        </button>

                        {holdExpiry && timeLeft && (
                            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-md ml-auto">
                                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-sm font-semibold text-orange-600">Time left: {timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="bg-card rounded-lg shadow-lg border border-border p-6">
                    {/* Legend */}
                    <div className="flex justify-center gap-6 mb-6 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-background border-2 border-green-400 rounded"></div>
                            <span>AVAILABLE</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-300 border-2 border-gray-400 rounded"></div>
                            <span>BOOKED</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 border-2 border-green-600 rounded"></div>
                            <span>SELECTED</span>
                        </div>
                    </div>

                    {(() => {
                        const screenPosition = showData?.screen?.layout?.screenPosition || 'bottom';
                        const screenIndicator = (
                            <div className="my-6">
                                <div className="relative">
                                    <div className="h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full mb-2"></div>
                                    <div className="text-center">
                                        <div className="inline-block bg-blue-50 dark:bg-blue-900/30 px-4 py-1 rounded-full">
                                            <span className="text-xs font-medium text-blue-600 dark:text-blue-400 tracking-wider">
                                                SCREEN THIS WAY
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                        const seatLayout = (
                            <div className="space-y-8">
                                {renderSeatSection(categorizedSeats.premium, 'PREMIUM', getSeatPrice('premium'))}
                                {categorizedSeats.premium.length > 0 && categorizedSeats.gold.length > 0 && <div className="h-4"></div>}
                                {renderSeatSection(categorizedSeats.gold, 'GOLD', getSeatPrice('gold'))}
                                {categorizedSeats.gold.length > 0 && categorizedSeats.silver.length > 0 && <div className="h-4"></div>}
                                {renderSeatSection(categorizedSeats.silver, 'SILVER', getSeatPrice('silver'))}
                            </div>
                        );
                        return screenPosition === 'top' ? (
                            <>{screenIndicator}{seatLayout}</>
                        ) : (
                            <>{seatLayout}{screenIndicator}</>
                        );
                    })()}
                </div>
            </div>

            {/* Bottom Payment Bar */}
            {selectedSeats.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-20">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4">
                        {!holdExpiry ? (
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Selected: {selectedSeats.length} seat(s)</p>
                                    <p className="text-xl font-bold">Total: ₹{calculateTotal()}</p>
                                </div>
                                <button
                                    onClick={handleHoldSeats}
                                    disabled={isProcessing}
                                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-semibold disabled:opacity-50 transition"
                                >
                                    {isProcessing ? 'Processing...' : 'Proceed to Payment'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Your Booking</p>
                                        <p className="font-semibold">{showData.movie?.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {showData.screen?.name} | {showData.show_details?.start_time}
                                        </p>
                                        <p className="text-sm mt-2">
                                            Seats: {selectedSeats.map(id =>
                                                showData?.screen?.layout?.seats.find(s => s.id === id)?.seat_label
                                            ).filter(Boolean).join(', ')}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-muted-foreground">Total</p>
                                        <p className="text-2xl font-bold">₹{calculateTotal()}</p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCancelBooking}
                                        disabled={isProcessing}
                                        className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePayment}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Processing...' : `Pay ₹${calculateTotal()}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Login Modal */}
            <LoginModal open={loginOpen} onOpenChange={setLoginOpen} />
        </div>
    );
};

export default SeatSelectionPage;
