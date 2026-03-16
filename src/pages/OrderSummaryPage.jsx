import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';

const CONVENIENCE_FEE_PER_TICKET = 15;

const PaymentOption = ({ icon, label, selected, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left border-b border-border transition-colors ${selected ? 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-600' : 'hover:bg-secondary/50'}`}
    >
        <span className="text-xl">{icon}</span>
        <span className={`text-sm font-medium ${selected ? 'text-red-600' : ''}`}>{label}</span>
    </button>
);

const OrderSummaryPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { customer } = useCustomerAuth();
    const { initiatePayment } = useRazorpayPayment();

    const [timeLeft, setTimeLeft] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState('upi');

    // Redirect if no state (direct URL access)
    useEffect(() => {
        if (!state?.showId) {
            navigate('/movies', { replace: true });
        }
    }, [state, navigate]);

    // Countdown timer
    useEffect(() => {
        if (!state?.holdExpiry) return;

        const interval = setInterval(() => {
            const diff = new Date(state.holdExpiry) - new Date();
            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft(null);
                toast.error('Seat hold expired. Please select again.');
                navigate(`/show/${state.showId}`, { replace: true });
            } else {
                const minutes = Math.floor(diff / 60000);
                const seconds = Math.floor((diff % 60000) / 1000);
                setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [state?.holdExpiry, navigate, state?.showId]);

    const handleCancel = async () => {
        try {
            await bookingAPI.releaseSeats(state.showId, state.selectedSeats);
        } catch (_) {
            // Silently ignore release errors
        }
        navigate(`/show/${state.showId}`, { replace: true });
    };

    const handlePay = async () => {
        if (!customer) {
            toast.error('Please login to continue');
            return;
        }

        const convenienceFees = state.selectedSeats.length * CONVENIENCE_FEE_PER_TICKET;
        const grandTotal = state.totalAmount + convenienceFees;

        try {
            setIsProcessing(true);
            const result = await initiatePayment({
                show_id: state.showId,
                seats: state.selectedSeats,
                amount: grandTotal,
                customer,
            });
            toast.success('Payment successful! Booking confirmed.');
            navigate(`/booking/success?payment_id=${result.booking.payment_id}`, { replace: true });
        } catch (error) {
            if (error?.message === 'Payment cancelled by user') {
                toast.info('Payment cancelled.');
            } else {
                console.error('Payment failed:', error);
                toast.error('Payment failed. Please try again.');
            }
        } finally {
            setIsProcessing(false);
        }
    };

    if (!state?.showId) return null;

    const convenienceFees = state.selectedSeats.length * CONVENIENCE_FEE_PER_TICKET;
    const grandTotal = state.totalAmount + convenienceFees;

    // Group seats by category label (derived from seatLabels — all same type for simplicity)
    const seatDisplay = state.seatLabels?.join(', ') || state.selectedSeats.join(', ');

    const paymentOptions = [
        { id: 'upi', icon: '📱', label: 'Pay by any UPI App' },
        { id: 'card', icon: '💳', label: 'Debit / Credit Card' },
        { id: 'wallet', icon: '👛', label: 'Mobile Wallets' },
        { id: 'netbanking', icon: '🏦', label: 'Net Banking' },
    ];

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="p-2 hover:bg-secondary rounded-md transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-base font-semibold">{state.movieTitle}</h1>
                        <p className="text-xs text-muted-foreground">
                            {state.cinemaName} &bull; {state.showDate} &bull; {state.startTime}
                        </p>
                    </div>
                    {timeLeft && (
                        <div className="ml-auto flex items-center gap-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-600 text-xs font-semibold px-3 py-1.5 rounded-full">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {timeLeft}
                        </div>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start">

                    {/* Left: Payment Options */}
                    <div className="w-full lg:w-[60%] bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold">Payment Options</h2>
                        </div>
                        <div className="divide-y divide-border">
                            {paymentOptions.map(opt => (
                                <PaymentOption
                                    key={opt.id}
                                    icon={opt.icon}
                                    label={opt.label}
                                    selected={selectedPayment === opt.id}
                                    onClick={() => setSelectedPayment(opt.id)}
                                />
                            ))}
                        </div>

                        {/* Selected option detail */}
                        <div className="px-5 py-5 border-t border-border bg-secondary/30">
                            <p className="text-sm text-muted-foreground mb-4">
                                {selectedPayment === 'upi' && 'Pay securely using any UPI app like GPay, PhonePe, Paytm, etc.'}
                                {selectedPayment === 'card' && 'Pay using your Debit or Credit card.'}
                                {selectedPayment === 'wallet' && 'Pay using mobile wallets like Paytm, Amazon Pay, etc.'}
                                {selectedPayment === 'netbanking' && 'Pay directly from your bank account.'}
                            </p>
                            <button
                                onClick={handlePay}
                                disabled={isProcessing}
                                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-3.5 rounded-lg font-semibold text-sm transition"
                            >
                                {isProcessing ? 'Processing...' : `Pay ₹${grandTotal.toLocaleString('en-IN')}`}
                            </button>
                            <p className="text-xs text-muted-foreground text-center mt-3">
                                By proceeding, I express my consent to complete this transaction.
                            </p>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-full lg:w-[40%] bg-card rounded-xl border border-border overflow-hidden shadow-sm sticky top-20">
                        {/* Movie info */}
                        <div className="px-5 py-4 border-b border-border">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold text-base">{state.movieTitle}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {state.showDate} &bull; {state.startTime}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{state.language} ({state.screenType})</p>
                                </div>
                                <span className="text-sm font-bold text-foreground">{state.selectedSeats.length}</span>
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="px-5 py-3 border-b border-border">
                            <p className="text-xs text-muted-foreground mb-1">Seats</p>
                            <p className="text-sm font-medium">{seatDisplay}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{state.cinemaName}</p>
                        </div>

                        {/* Price breakdown */}
                        <div className="px-5 py-4 space-y-2.5">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Ticket(s) price</span>
                                <span>₹{state.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Convenience fees
                                    <span className="text-xs ml-1 text-muted-foreground/70">(₹{CONVENIENCE_FEE_PER_TICKET}/ticket)</span>
                                </span>
                                <span>₹{convenienceFees}</span>
                            </div>
                            <div className="border-t border-border pt-2.5 flex justify-between font-semibold">
                                <span>Amount Payable</span>
                                <span>₹{grandTotal.toLocaleString('en-IN')}</span>
                            </div>
                        </div>

                        {/* Cancel link */}
                        <div className="px-5 pb-4">
                            <button
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition"
                            >
                                Cancel and release seats
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSummaryPage;
