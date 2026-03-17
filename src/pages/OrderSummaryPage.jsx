import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, settingsAPI, offersAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import {
    Tag, X, CheckCircle, Loader2, ChevronLeft, Clock,
    Calendar, MapPin, Ticket, CreditCard, Wallet, Building2,
    Shield, Lock, Percent, Film, Armchair,
} from 'lucide-react';

/* ── Payment method pill ── */
const PaymentPill = ({ icon, label }) => (
    <div className="flex items-center gap-1.5 bg-secondary/60 border border-border rounded-md px-2.5 py-1.5">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
    </div>
);

/* ── Price row ── */
const PriceRow = ({ label, sub, value, highlight, icon }) => (
    <div className={`flex justify-between items-center text-sm ${highlight ? 'text-emerald-500' : ''}`}>
        <span className={`flex items-center gap-1.5 ${highlight ? '' : 'text-muted-foreground'}`}>
            {icon && <span className="opacity-70">{icon}</span>}
            {label}
            {sub && <span className="text-xs opacity-60 ml-0.5">{sub}</span>}
        </span>
        <span className={highlight ? 'font-semibold' : ''}>{value}</span>
    </div>
);

const OrderSummaryPage = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const { customer } = useCustomerAuth();
    const { initiatePayment } = useRazorpayPayment();

    const [timeLeft, setTimeLeft] = useState(null);
    const [isUrgent, setIsUrgent] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [convenienceFeePerTicket, setConvenienceFeePerTicket] = useState(null);
    const [gstPercentage, setGstPercentage] = useState(null);

    const [couponInput, setCouponInput] = useState('');
    const [appliedOffer, setAppliedOffer] = useState(null);
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
                setIsUrgent(diff < 60000);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [state?.holdExpiry, navigate, state?.showId]);

    const handleApplyCoupon = async () => {
        if (!couponInput.trim() || !settingsLoaded) return;
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

    const handleRemoveCoupon = () => { setAppliedOffer(null); setCouponError(null); };

    const handleCancel = async () => {
        try { await bookingAPI.releaseSeats(state.showId, state.selectedSeats); } catch { /* silent */ }
        navigate(`/show/${state.showId}`, { replace: true });
    };

    const handlePay = async () => {
        if (!customer) { toast.error('Please login to continue'); return; }
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
                    reason, showId: state.showId, selectedSeats: state.selectedSeats,
                    seatLabels: state.seatLabels, holdExpiry: state.holdExpiry,
                    totalAmount: state.totalAmount, movieTitle: state.movieTitle,
                    cinemaName: state.cinemaName, showDate: state.showDate,
                    startTime: state.startTime, language: state.language,
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

    const settingsLoaded = convenienceFeePerTicket !== null && gstPercentage !== null;
    const convenienceTotal = settingsLoaded ? numTickets * convenienceFeePerTicket : 0;
    const gstAmount = settingsLoaded ? +(convenienceTotal * (gstPercentage / 100)).toFixed(2) : 0;
    const subtotal = state.totalAmount + convenienceTotal + gstAmount;
    const discountAmount = appliedOffer?.discount_amount ?? 0;
    const grandTotal = +(subtotal - discountAmount).toFixed(2);

    return (
        <div className="min-h-screen bg-background">

            {/* ── Sticky header ── */}
            <div className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-10">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-3 flex items-center gap-3">
                    <button
                        onClick={handleCancel}
                        disabled={isProcessing}
                        className="p-1.5 hover:bg-secondary rounded-lg transition flex-shrink-0"
                        aria-label="Go back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex-1 min-w-0">
                        <h1 className="text-sm sm:text-base font-semibold truncate flex items-center gap-1.5">
                            <Film className="w-4 h-4 text-violet-500 flex-shrink-0" />
                            {state.movieTitle}
                        </h1>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                            <span className="inline-flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{state.cinemaName}
                            </span>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span className="inline-flex items-center gap-1">
                                <Calendar className="w-3 h-3" />{state.showDate}
                            </span>
                            <span className="mx-1.5 opacity-40">·</span>
                            <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3" />{state.startTime}
                            </span>
                        </p>
                    </div>

                    {timeLeft && (
                        <div className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            isUrgent
                                ? 'bg-red-100 dark:bg-red-900/40 text-red-500 animate-pulse'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600'
                        }`}>
                            <Clock className="w-3.5 h-3.5" />
                            {timeLeft}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Body ── */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start max-w-4xl mx-auto lg:max-w-none">

                    {/* ════ LEFT: Payment panel ════ */}
                    <div className="w-full lg:w-[55%] space-y-4">

                        {/* Razorpay card */}
                        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                            <div className="px-5 pt-5 pb-4 border-b border-border flex items-center gap-2">
                                <Lock className="w-4 h-4 text-emerald-500" />
                                <h2 className="text-sm font-semibold">Secure Payment</h2>
                            </div>

                            <div className="px-5 py-5 space-y-5">

                                {/* Razorpay branding */}
                                <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-xl border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/30">
                                    {/* Decorative circle */}
                                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-400/10 pointer-events-none" />
                                    <div className="absolute -right-2 -bottom-4 w-14 h-14 rounded-full bg-indigo-400/10 pointer-events-none" />

                                    {/* Razorpay icon */}
                                    <div className="w-12 h-12 rounded-xl bg-[#2F80ED] flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/30">
                                        <svg className="h-7 w-7" viewBox="0 0 28 32" fill="none">
                                            <path d="M15.5 0L6 17h7L9 32 26 12.5h-8L24 0H15.5Z" fill="white" />
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-bold text-[#2F80ED]">razorpay</span>
                                            <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded-full">PCI-DSS</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            256-bit SSL encrypted &amp; secure checkout
                                        </p>
                                    </div>
                                </div>

                                {/* Payment method chips */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2 font-medium uppercase tracking-wide">Accepted payment methods</p>
                                    <div className="flex flex-wrap gap-2">
                                        <PaymentPill icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10h20" stroke="currentColor" strokeWidth="1.5"/></svg>} label="Cards" />
                                        <PaymentPill
                                            icon={
                                                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 2L4 6v6c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V6l-8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                                                    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            }
                                            label="UPI"
                                        />
                                        <PaymentPill icon={<Wallet className="w-4 h-4" />} label="Wallets" />
                                        <PaymentPill icon={<Building2 className="w-4 h-4" />} label="Net Banking" />
                                        <PaymentPill icon={<CreditCard className="w-4 h-4" />} label="EMI" />
                                    </div>
                                </div>

                                {/* Coupon / Offer Code */}
                                <div>
                                    <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-violet-500" />
                                        Coupon / Offer Code
                                    </p>

                                    {appliedOffer ? (
                                        <div className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border border-emerald-500/40 bg-emerald-500/8 dark:bg-emerald-500/10">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono font-bold text-sm text-emerald-500">{appliedOffer.offer_code}</p>
                                                    <p className="text-xs text-muted-foreground">₹{appliedOffer.discount_amount} discount applied</p>
                                                </div>
                                            </div>
                                            <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-foreground transition p-1 rounded-lg hover:bg-secondary flex-shrink-0">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
                                                    <input
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                                                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                        placeholder="Enter offer code"
                                                        className="w-full bg-secondary/50 border border-border rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/60 transition"
                                                        disabled={isValidating || !settingsLoaded}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponInput.trim() || isValidating || !settingsLoaded}
                                                    className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 disabled:opacity-50 text-white text-sm font-semibold transition flex items-center gap-1.5 shadow-sm shadow-violet-500/30"
                                                >
                                                    {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-xs text-red-400 flex items-center gap-1">
                                                    <X className="w-3 h-3" />{couponError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Amount to pay summary */}
                                <div className="rounded-xl bg-gradient-to-r from-secondary/60 to-secondary/40 border border-border px-4 py-3.5 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Total amount to pay</p>
                                        <p className="text-xl font-bold mt-0.5">
                                            {settingsLoaded ? `₹${grandTotal.toLocaleString('en-IN')}` : <span className="text-muted-foreground animate-pulse">Loading...</span>}
                                        </p>
                                    </div>
                                    {appliedOffer && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground line-through">₹{subtotal.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-emerald-500 font-semibold">−₹{discountAmount} saved</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pay button */}
                                <button
                                    onClick={handlePay}
                                    disabled={isProcessing || !settingsLoaded}
                                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:from-blue-700 active:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold text-sm transition-all shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            {settingsLoaded ? `Pay ₹${grandTotal.toLocaleString('en-IN')}` : 'Loading...'}
                                        </>
                                    )}
                                </button>

                                {/* Trust row */}
                                <div className="flex items-center justify-center gap-4 pt-1">
                                    <div className="flex items-center gap-1 text-muted-foreground">
                                        <Shield className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="text-xs">100% Secure</span>
                                    </div>
                                    <div className="w-px h-3 bg-border" />
                                    <p className="text-xs text-muted-foreground text-center">
                                        By proceeding, I consent to complete this transaction.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ════ RIGHT: Order Summary ════ */}
                    <div className="w-full lg:w-[45%] bg-card rounded-2xl border border-border overflow-hidden shadow-sm lg:sticky lg:top-20">

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-violet-500/5 to-blue-500/5">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <h3 className="font-bold text-base truncate flex items-center gap-1.5">
                                        <Film className="w-4 h-4 text-violet-500 flex-shrink-0" />
                                        {state.movieTitle}
                                    </h3>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />{state.showDate}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />{state.startTime}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 opacity-80">
                                        {state.language} &bull; {state.screenType}
                                    </p>
                                </div>
                                <div className="flex-shrink-0 flex flex-col items-end gap-1">
                                    <span className="text-xs font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                                        <Ticket className="w-3 h-3" />
                                        {numTickets} {numTickets === 1 ? 'Ticket' : 'Tickets'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Seat info */}
                        <div className="px-5 py-3.5 border-b border-border">
                            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                                <Armchair className="w-3 h-3" /> Seats
                            </p>
                            <p className="text-sm font-semibold font-mono tracking-wide">{seatDisplay}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{state.cinemaName}
                            </p>
                        </div>

                        {/* Price breakdown */}
                        <div className="px-5 py-4 space-y-3">
                            <PriceRow
                                label="Ticket(s) price"
                                value={`₹${state.totalAmount.toLocaleString('en-IN')}`}
                                icon={<Ticket className="w-3.5 h-3.5" />}
                            />
                            <PriceRow
                                label="Convenience fee"
                                sub={settingsLoaded ? `(₹${convenienceFeePerTicket}/ticket)` : ''}
                                value={settingsLoaded ? `₹${convenienceTotal.toLocaleString('en-IN')}` : '...'}
                                icon={<CreditCard className="w-3.5 h-3.5" />}
                            />
                            {settingsLoaded && gstAmount > 0 && (
                                <PriceRow
                                    label="GST"
                                    sub={`(${gstPercentage}% on conv. fee)`}
                                    value={`₹${gstAmount.toLocaleString('en-IN')}`}
                                    icon={<Percent className="w-3.5 h-3.5" />}
                                />
                            )}
                            {appliedOffer && (
                                <PriceRow
                                    label="Discount"
                                    sub={`(${appliedOffer.offer_code})`}
                                    value={`−₹${appliedOffer.discount_amount.toLocaleString('en-IN')}`}
                                    highlight
                                    icon={<Tag className="w-3.5 h-3.5" />}
                                />
                            )}

                            <div className="border-t border-border pt-3 flex justify-between items-center">
                                <span className="font-bold text-sm">Amount Payable</span>
                                <span className="font-bold text-lg">
                                    {settingsLoaded ? `₹${grandTotal.toLocaleString('en-IN')}` : '...'}
                                </span>
                            </div>
                        </div>

                        {/* Cancel link */}
                        <div className="px-5 pb-4 border-t border-border pt-3">
                            <button
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className="text-xs text-muted-foreground hover:text-red-400 underline underline-offset-2 transition flex items-center gap-1"
                            >
                                <X className="w-3 h-3" /> Cancel and release seats
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderSummaryPage;
