import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI } from '../services/api';

const BookingFailurePage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [timeLeft, setTimeLeft] = useState(null);
    const [isReleasing, setIsReleasing] = useState(false);

    const isCancelled = state?.reason === 'cancelled';

    useEffect(() => {
        if (!state?.showId) navigate('/movies', { replace: true });
    }, [state, navigate]);

    useEffect(() => {
        if (!state?.holdExpiry) return;
        const interval = setInterval(() => {
            const diff = new Date(state.holdExpiry) - new Date();
            if (diff <= 0) {
                clearInterval(interval);
                navigate(`/show/${state.showId}`, { replace: true });
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [state?.holdExpiry, navigate, state?.showId]);

    const handleTryAgain = () => {
        const { reason, ...orderState } = state;
        navigate('/order-summary', { state: orderState });
    };

    const handleRelease = async () => {
        setIsReleasing(true);
        try {
            await bookingAPI.releaseSeats(state.showId, state.selectedSeats);
        } catch (error) {
            console.error('Failed to release seats:', error);
        }
        navigate(`/show/${state.showId}`, { replace: true });
    };

    if (!state?.showId) return null;

    const numTickets = state.selectedSeats?.length ?? 0;
    const seatDisplay = state.seatLabels?.join(', ') || state.selectedSeats?.join(', ');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center gap-3">
                    <button
                        onClick={handleRelease}
                        disabled={isReleasing}
                        className="p-2 hover:bg-secondary rounded-md transition flex-shrink-0"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm sm:text-base font-semibold truncate">{state.movieTitle}</h1>
                        <p className="text-xs text-muted-foreground truncate">
                            {state.cinemaName} &bull; {state.showDate} &bull; {state.startTime}
                        </p>
                    </div>
                    {timeLeft && (
                        <div className="flex-shrink-0 flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeLeft}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-10">
                <div className="max-w-md mx-auto">
                    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        {/* Status icon + title */}
                        <div className="px-6 py-8 flex flex-col items-center text-center border-b border-border">
                            {isCancelled ? (
                                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            )}
                            <h2 className="text-xl font-bold mb-1">
                                {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {isCancelled
                                    ? 'You cancelled the payment. Your seats are still held.'
                                    : 'Something went wrong while processing your payment. Your seats are still held.'}
                            </p>
                        </div>

                        {/* Booking summary */}
                        <div className="px-6 py-4 space-y-3 border-b border-border">
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Movie</p>
                                <p className="text-sm font-medium">{state.movieTitle}</p>
                                <p className="text-xs text-muted-foreground">
                                    {state.showDate} &bull; {state.startTime}
                                </p>
                                {state.language && (
                                    <p className="text-xs text-muted-foreground">{state.language} ({state.screenType})</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground mb-0.5">Seats</p>
                                <p className="text-sm font-medium">{seatDisplay}</p>
                                <p className="text-xs text-muted-foreground">{state.cinemaName}</p>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{numTickets} {numTickets === 1 ? 'Ticket' : 'Tickets'}</span>
                                <span className="font-semibold">₹{state.totalAmount?.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-5 space-y-3">
                            <button
                                onClick={handleTryAgain}
                                disabled={isReleasing}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white py-3 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                            <button
                                onClick={handleRelease}
                                disabled={isReleasing}
                                className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-2 transition disabled:opacity-50"
                            >
                                {isReleasing ? 'Releasing seats...' : 'Release seats and go back'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingFailurePage;
