import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { ChevronLeft, Clock, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';

const BookingFailurePage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const [timeLeft, setTimeLeft] = useState(null);
    const [isReleasing, setIsReleasing] = useState(false);

    const isCancelled = state?.reason === 'cancelled';
    const isUrgent = timeLeft && parseInt(timeLeft.split(':')[0]) < 2;

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
        <div className="min-h-screen bg-background text-foreground">
            {/* Sticky Header - Glassmorphic Frosted Bar */}
            <div className="sticky top-0 z-35 backdrop-blur-md bg-background/80 border-b border-border/60 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-3 sm:px-6 lg:px-14 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleRelease}
                            disabled={isReleasing}
                            className="p-2 bg-secondary/40 hover:bg-secondary/70 border border-border/60 rounded-xl transition flex-shrink-0 cursor-pointer custom-hover"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </button>
                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-bold leading-tight truncate text-foreground">
                                {state.movieTitle}
                            </h1>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {state.cinemaName} &bull; {state.showDate} &bull; {state.startTime}
                            </p>
                        </div>
                        {timeLeft && (
                            <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-all duration-300 border ${
                                isUrgent
                                    ? 'bg-destructive/10 text-destructive border-destructive/20 animate-pulse shadow-sm shadow-destructive/10'
                                    : 'bg-warning/10 text-warning border-warning/20 shadow-sm shadow-warning/5'
                            }`}>
                                <Clock className="w-3.5 h-3.5" />
                                <span>{timeLeft}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-12">
                <div className="max-w-md mx-auto">
                    <div className="bg-card border border-border/80 rounded-2xl overflow-hidden shadow-xl relative">
                        {/* Status icon + title */}
                        <div className="px-6 py-10 flex flex-col items-center text-center border-b border-border/60">
                            {isCancelled ? (
                                <div className="relative inline-flex items-center justify-center mb-5">
                                    <div className="absolute w-20 h-20 rounded-full bg-warning/20 animate-ping" />
                                    <div className="relative w-16 h-16 rounded-full bg-warning/15 flex items-center justify-center ring-4 ring-warning/30">
                                        <AlertTriangle className="w-8 h-8 text-warning" strokeWidth={2.5} />
                                    </div>
                                </div>
                            ) : (
                                <div className="relative inline-flex items-center justify-center mb-5">
                                    <div className="absolute w-20 h-20 rounded-full bg-destructive/20 animate-ping" />
                                    <div className="relative w-16 h-16 rounded-full bg-destructive/15 flex items-center justify-center ring-4 ring-destructive/30">
                                        <XCircle className="w-8 h-8 text-destructive" strokeWidth={2.5} />
                                    </div>
                                </div>
                            )}
                            <h2 className="text-2xl font-extrabold tracking-tight mb-2">
                                {isCancelled ? 'Payment Cancelled' : 'Payment Failed'}
                            </h2>
                            <p className="text-sm text-muted-foreground max-w-sm">
                                {isCancelled
                                    ? 'You cancelled the payment process. Your selected seats are still held for a limited time.'
                                    : 'Something went wrong while processing your payment. Your selected seats are still held for a limited time.'}
                            </p>
                        </div>

                        {/* Booking summary */}
                        <div className="px-6 py-6 space-y-4 border-b border-border/60 bg-secondary/15">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Movie</p>
                                <p className="text-sm font-bold text-foreground">{state.movieTitle}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {state.showDate} &bull; {state.startTime}
                                </p>
                                {state.language && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{state.language} ({state.screenType || '2D'})</p>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Seats</p>
                                <p className="text-sm font-bold text-foreground">{seatDisplay}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{state.cinemaName}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-border/40">
                                <span className="text-muted-foreground font-medium">{numTickets} {numTickets === 1 ? 'Ticket' : 'Tickets'}</span>
                                <span className="font-bold font-mono text-base">₹{state.totalAmount?.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="px-6 py-6 space-y-3">
                            <button
                                onClick={handleTryAgain}
                                disabled={isReleasing}
                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:pointer-events-none custom-hover flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </button>
                            <button
                                onClick={handleRelease}
                                disabled={isReleasing}
                                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-xl transition-all cursor-pointer"
                            >
                                {isReleasing ? 'Releasing seats...' : 'Cancel and Release seats'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BookingFailurePage;
