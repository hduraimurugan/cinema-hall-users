import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, settingsAPI, offersAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import { Tag, X, CheckCircle, Loader2 } from 'lucide-react';

const OrderSummaryPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { customer } = useCustomerAuth();
    const { initiatePayment } = useRazorpayPayment();

    const [timeLeft, setTimeLeft] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [convenienceFeePerTicket, setConvenienceFeePerTicket] = useState(null);
    const [gstPercentage, setGstPercentage] = useState(null);

    // Coupon state
    const [couponInput, setCouponInput] = useState('');
    const [appliedOffer, setAppliedOffer] = useState(null); // { discount_amount, offer_title, offer_code, offer_id }
    const [couponError, setCouponError] = useState(null);
    const [isValidating, setIsValidating] = useState(false);

    useEffect(() => {
        if (!state?.showId) navigate('/movies', { replace: true });
    }, [state, navigate]);

    useEffect(() => {
        settingsAPI.getSettings()
            .then(data => {
                setConvenienceFeePerTicket(data.convenience_fee_per_ticket ?? 15);
                setGstPercentage(data.gst_percentage ?? 18);
            })
            .catch(() => {
                setConvenienceFeePerTicket(15);
                setGstPercentage(18);
            });
    }, []);

    useEffect(() => {
        if (!state?.holdExpiry) return;
        const interval = setInterval(() => {
            const diff = new Date(state.holdExpiry) - new Date();
            if (diff <= 0) {
                clearInterval(interval);
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

    const handleApplyCoupon = async () => {
        if (!couponInput.trim()) return;
        if (!settingsLoaded) return;
        setCouponError(null);
        setIsValidating(true);
        try {
            const result = await offersAPI.validateOffer({
                offer_code: couponInput.trim().toUpperCase(),
                show_id: state.showId,
                total_amount: state.totalAmount + convenienceTotal + gstAmount,
            });
            setAppliedOffer({
                offer_id: result.offer_id,
                offer_code: result.offer_code,
                offer_title: result.offer_title,
                discount_amount: result.discount_amount,
            });
            setCouponInput('');
            toast.success(`"${result.offer_code}" applied — ₹${result.discount_amount} off!`);
        } catch (err) {
            setCouponError(err?.error || 'Invalid or ineligible offer code.');
        } finally {
            setIsValidating(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedOffer(null);
        setCouponError(null);
    };

    const handleCancel = async () => {
        try {
            await bookingAPI.releaseSeats(state.showId, state.selectedSeats);
        } catch (error) {
            console.error('Failed to release seats:', error);
        }
        navigate(`/show/${state.showId}`, { replace: true });
    };

    const handlePay = async () => {
        if (!customer) {
            toast.error('Please login to continue');
            return;
        }
        try {
            setIsProcessing(true);
            const result = await initiatePayment({
                show_id: state.showId,
                seats: state.selectedSeats,
                customer,
                offer_code: appliedOffer?.offer_code,
            });
            toast.success('Payment successful! Booking confirmed.');
            navigate(`/booking/success?payment_id=${result.booking.payment_id}`, { replace: true });
        } catch (error) {
            const reason = error?.message === 'Payment cancelled by user' ? 'cancelled' : 'failed';
            navigate('/booking/failure', {
                state: {
                    reason,
                    showId: state.showId,
                    selectedSeats: state.selectedSeats,
                    seatLabels: state.seatLabels,
                    holdExpiry: state.holdExpiry,
                    totalAmount: state.totalAmount,
                    movieTitle: state.movieTitle,
                    cinemaName: state.cinemaName,
                    showDate: state.showDate,
                    startTime: state.startTime,
                    language: state.language,
                    screenType: state.screenType,
                },
            });
        } finally {
            setIsProcessing(false);
        }
    };

    if (!state?.showId) return null;

    const numTickets = state.selectedSeats.length;
    const seatDisplay = state.seatLabels?.join(', ') || state.selectedSeats.join(', ');

    // Show loading state while settings are fetching
    const settingsLoaded = convenienceFeePerTicket !== null && gstPercentage !== null;
    const convenienceTotal = settingsLoaded ? numTickets * convenienceFeePerTicket : 0;
    const gstAmount = settingsLoaded ? +(convenienceTotal * (gstPercentage / 100)).toFixed(2) : 0;
    const subtotal = state.totalAmount + convenienceTotal + gstAmount;
    const discountAmount = appliedOffer?.discount_amount ?? 0;
    const grandTotal = +(subtotal - discountAmount).toFixed(2);

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-card border-b border-border sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isProcessing}
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
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start max-w-4xl mx-auto lg:max-w-none">

                    {/* Left: Razorpay payment panel */}
                    <div className="w-full lg:w-[55%] bg-card rounded-xl border border-border overflow-hidden shadow-sm">
                        <div className="px-5 py-4 border-b border-border">
                            <h2 className="text-base font-semibold">Payment</h2>
                        </div>

                        <div className="px-5 py-6">
                            {/* Razorpay branding */}
                            <div className="flex items-center gap-3 p-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 mb-6">
                                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold">Secure Payment via Razorpay</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        UPI, Cards, Wallets, Net Banking &amp; more
                                    </p>
                                </div>
                            </div>

                            {/* Coupon / Offer Code */}
                            <div className="mb-5">
                                <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                    <Tag className="w-3.5 h-3.5 text-violet-500" /> Coupon / Offer Code
                                </p>
                                {appliedOffer ? (
                                    <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <span className="font-mono font-bold text-sm text-emerald-500">{appliedOffer.offer_code}</span>
                                                <span className="text-xs text-muted-foreground ml-2">— ₹{appliedOffer.discount_amount} off</span>
                                            </div>
                                        </div>
                                        <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-foreground transition flex-shrink-0 p-0.5">
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1.5">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponInput}
                                                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                                                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                placeholder="Enter offer code"
                                                className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                                                disabled={isValidating || !settingsLoaded}
                                            />
                                            <button
                                                onClick={handleApplyCoupon}
                                                disabled={!couponInput.trim() || isValidating || !settingsLoaded}
                                                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center gap-1.5"
                                            >
                                                {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && (
                                            <p className="text-xs text-red-400">{couponError}</p>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Amount summary */}
                            <div className="rounded-lg bg-secondary/40 px-4 py-3 mb-6 flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Amount to pay</span>
                                <span className="text-xl font-bold">
                                    {settingsLoaded ? `₹${grandTotal.toLocaleString('en-IN')}` : '...'}
                                </span>
                            </div>

                            {/* Pay button */}
                            <button
                                onClick={handlePay}
                                disabled={isProcessing || !settingsLoaded}
                                className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white py-3.5 rounded-lg font-semibold text-sm transition flex items-center justify-center gap-2"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                        {settingsLoaded ? `Pay ₹${grandTotal.toLocaleString('en-IN')}` : 'Loading...'}
                                    </>
                                )}
                            </button>

                            <p className="text-xs text-muted-foreground text-center mt-3">
                                By proceeding, I express my consent to complete this transaction.
                            </p>
                        </div>
                    </div>

                    {/* Right: Order Summary */}
                    <div className="w-full lg:w-[45%] bg-card rounded-xl border border-border overflow-hidden shadow-sm lg:sticky lg:top-20">
                        {/* Movie info */}
                        <div className="px-5 py-4 border-b border-border">
                            <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                    <h3 className="font-semibold text-base truncate">{state.movieTitle}</h3>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        {state.showDate} &bull; {state.startTime}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{state.language} ({state.screenType})</p>
                                </div>
                                <span className="text-sm font-bold bg-secondary px-2 py-0.5 rounded flex-shrink-0">
                                    {numTickets} {numTickets === 1 ? 'Ticket' : 'Tickets'}
                                </span>
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
                                    {settingsLoaded && (
                                        <span className="text-xs ml-1 opacity-60">(₹{convenienceFeePerTicket}/ticket)</span>
                                    )}
                                </span>
                                <span>{settingsLoaded ? `₹${convenienceTotal.toLocaleString('en-IN')}` : '...'}</span>
                            </div>
                            {settingsLoaded && gstAmount > 0 && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        GST
                                        <span className="text-xs ml-1 opacity-60">({gstPercentage}% on conv. fee)</span>
                                    </span>
                                    <span>₹{gstAmount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            {appliedOffer && (
                                <div className="flex justify-between text-sm text-emerald-500">
                                    <span className="flex items-center gap-1">
                                        <Tag className="w-3 h-3" />
                                        Discount
                                        <span className="text-xs font-mono">({appliedOffer.offer_code})</span>
                                    </span>
                                    <span>−₹{appliedOffer.discount_amount.toLocaleString('en-IN')}</span>
                                </div>
                            )}
                            <div className="border-t border-border pt-2.5 flex justify-between font-semibold">
                                <span>Amount Payable</span>
                                <span>{settingsLoaded ? `₹${grandTotal.toLocaleString('en-IN')}` : '...'}</span>
                            </div>
                        </div>

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
