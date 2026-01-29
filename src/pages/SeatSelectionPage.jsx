import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { showsAPI, bookingAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';

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
                fetchShowDetails(); // Refresh seat status
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

        if (priceOverride) {
            return priceOverride[seatType] || 0;
        }

        return layout?.pricing?.[seatType] || 0;
    };

    const calculateTotal = () => {
        return selectedSeats.reduce((total, seatId) => {
            const seat = showData?.screen?.layout?.seats.find(s => s.id === seatId);
            return total + (getSeatPrice(seat?.type) || 0);
        }, 0);
    };

    const toggleSeat = (seat) => {
        if (seat.status === 'booked' || seat.status === 'BOOKED') return;
        if (holdExpiry) return; // Can't change after holding

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
            toast.error('Please login to continue');
            return;
        }

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
            navigate('/booking/success', { state: { booking: result.booking } });
        } catch (error) {
            console.error('Payment failed:', error);
            toast.error('Payment failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const getSeatColor = (seat) => {
        if (selectedSeats.includes(seat.id)) return 'bg-green-500 text-white';
        if (seat.status === 'booked' || seat.status === 'BOOKED') return 'bg-red-500 cursor-not-allowed opacity-50';
        if (seat.status === 'HELD') return 'bg-yellow-500 cursor-not-allowed opacity-50';

        // Available - color by type
        if (seat.type === 'premium') return 'bg-purple-200 hover:bg-purple-300';
        if (seat.type === 'gold') return 'bg-yellow-200 hover:bg-yellow-300';
        return 'bg-blue-200 hover:bg-blue-300'; // silver
    };

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p className="text-center">Loading seat layout...</p>
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

    const seats = showData.screen?.layout?.seats || [];
    const rows = Math.max(...seats.map(s => s.row)) + 1;
    const columns = Math.max(...seats.map(s => s.column)) + 1;

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold">{showData.movie?.title}</h1>
                            <p className="text-sm text-muted-foreground">
                                {showData.screen?.name} | {showData.show_details?.start_time} | {showData.show_details?.language_version}
                            </p>
                        </div>

                        {holdExpiry && timeLeft && (
                            <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-lg">
                                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="font-semibold text-orange-600">Complete payment in {timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Screen Indicator */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-8">
                <div className="flex justify-center mb-8">
                    <div className="w-full max-w-3xl">
                        <div className="bg-gray-300 dark:bg-gray-700 h-2 rounded-t-full shadow-lg"></div>
                        <div className="text-center mt-2 text-sm text-muted-foreground">Screen</div>
                    </div>
                </div>

                {/* Seat Grid */}
                <div className="flex justify-center overflow-x-auto pb-4">
                    <div className="inline-block">
                        {Array.from({ length: rows }).map((_, rowIndex) => {
                            const rowSeats = seats.filter(s => s.row === rowIndex);

                            return (
                                <div key={rowIndex} className="flex items-center gap-1 mb-2">
                                    {/* Row Label */}
                                    <div className="w-8 text-center font-semibold text-sm text-muted-foreground">
                                        {String.fromCharCode(65 + rowIndex)}
                                    </div>

                                    {/* Seats */}
                                    {Array.from({ length: columns }).map((_, colIndex) => {
                                        const seat = rowSeats.find(s => s.column === colIndex);

                                        if (!seat || seat.type === 'passage') {
                                            return <div key={colIndex} className="w-8 h-8"></div>;
                                        }

                                        if (seat.isBlocked) {
                                            return <div key={colIndex} className="w-8 h-8 bg-gray-400 rounded opacity-30"></div>;
                                        }

                                        return (
                                            <button
                                                key={seat.id}
                                                onClick={() => toggleSeat(seat)}
                                                disabled={seat.status === 'booked' || seat.status === 'BOOKED' || seat.status === 'HELD' || holdExpiry}
                                                className={`w-8 h-8 rounded text-xs font-semibold transition ${getSeatColor(seat)}`}
                                                title={`${seat.seat_label} - ${seat.type} - ₹${getSeatPrice(seat.type)}`}
                                            >
                                                {colIndex + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-4 mt-8">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-200 rounded"></div>
                        <span className="text-sm">Silver</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-yellow-200 rounded"></div>
                        <span className="text-sm">Gold</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-purple-200 rounded"></div>
                        <span className="text-sm">Premium</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-green-500 rounded"></div>
                        <span className="text-sm">Selected</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-500 rounded opacity-50"></div>
                        <span className="text-sm">Booked</span>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
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
                                    className="bg-primary text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
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
                                        <p className="text-sm mt-2">Seats: {selectedSeats.join(', ')}</p>
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
                                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                                    >
                                        {isProcessing ? 'Processing...' : `Pay ₹${calculateTotal()}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SeatSelectionPage;
