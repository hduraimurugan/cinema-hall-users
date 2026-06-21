import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { bookingAPI, settingsAPI, offersAPI } from '../services/api';
import { useRazorpayPayment } from '../hooks/useRazorpayPayment';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { toast } from 'sonner';
import {
    Tag, X, CheckCircle, Loader2, ChevronLeft, Clock,
    Calendar, MapPin, Ticket, CreditCard, Wallet, Building2,
    Shield, Lock, Percent, Armchair, ChevronDown, ChevronUp,
    AlertCircle, Sparkles, Smartphone,
} from 'lucide-react';

/* ── Payment method pill ── */
const PaymentPill = ({ icon, label }) => (
    <div className="flex items-center gap-2 bg-secondary/30 border border-border/50 rounded-xl px-3 py-2 transition-all duration-200 hover:translate-y-[-1px] hover:bg-secondary/60 hover:border-border hover:text-foreground cursor-default text-muted-foreground group">
        <span className="opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-transform">{icon}</span>
        <span className="text-[11px] font-bold tracking-tight">{label}</span>
    </div>
);

/* ── Price row ── */
const PriceRow = ({ label, sub, value, highlight, icon }) => (
    <div className={`flex justify-between items-center text-sm ${highlight ? 'text-success font-semibold' : ''}`}>
        <span className={`flex items-center gap-1.5 ${highlight ? '' : 'text-muted-foreground'}`}>
            {icon && <span className="opacity-70">{icon}</span>}
            {label}
            {sub && <span className="text-xs opacity-60 ml-0.5">{sub}</span>}
        </span>
        <span className={`${highlight ? '' : 'font-medium'} font-mono`}>{value}</span>
    </div>
);

/* ── Offer discount label ── */
const discountLabel = (offer) => {
    if (offer.discount_type === 'fixed') return `₹${offer.discount_value} OFF`;
    const pct = `${offer.discount_value}% OFF`;
    return offer.max_discount_amount ? `${pct} upto ₹${offer.max_discount_amount}` : pct;
};

/* ── Format expiry date ── */
const fmtExpiry = (iso) =>
    new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/* ── Single offer card ── */
const OfferCard = ({ offer, isApplicable, neededMore, isApplied, onApply, isValidating, appliedOfferCode }) => {
    const isCurrentlyApplied = isApplied && appliedOfferCode === offer.code;

    return (
        <div
            className={`relative rounded-xl border transition-all overflow-hidden duration-300
                ${isCurrentlyApplied
                    ? 'border-success/50 bg-success/5 shadow-sm shadow-success/5'
                    : isApplicable
                        ? 'border-offer/30 bg-offer/5 hover:border-offer/60 hover:bg-offer/8 cursor-pointer hover:-translate-y-[1px] hover:shadow-md hover:shadow-offer/5'
                        : 'border-border bg-secondary/20 opacity-50 cursor-not-allowed'
                }
            `}
            onClick={() => isApplicable && !isCurrentlyApplied && !isValidating && onApply(offer.code)}
        >
            {/* Coloured left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl
                ${isCurrentlyApplied ? 'bg-success' : isApplicable ? 'bg-offer' : 'bg-border'}
            `} />

            <div className="pl-4 pr-3 py-3 flex items-start gap-3">
                {/* Discount badge */}
                <div className={`flex-shrink-0 rounded-lg px-2 py-1 text-center min-w-[64px]
                    ${isCurrentlyApplied
                        ? 'bg-success/15 text-success'
                        : isApplicable
                            ? 'bg-offer/15 text-offer'
                            : 'bg-secondary text-muted-foreground'
                    }
                `}>
                    <p className="text-[11px] font-black leading-tight tracking-tight whitespace-nowrap">
                        {discountLabel(offer)}
                    </p>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="font-mono font-bold text-xs tracking-wider text-foreground">{offer.code}</span>
                        {offer.scope === 'hall' && (
                            <span className="text-[10px] font-semibold bg-warning/15 text-warning px-1.5 py-0.5 rounded-full">
                                Hall Offer
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-semibold truncate text-foreground">{offer.title}</p>
                    {offer.description && (
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{offer.description}</p>
                    )}

                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {offer.min_booking_amount > 0 && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                <AlertCircle className="w-3 h-3 text-muted-foreground/75" />
                                Min ₹{offer.min_booking_amount}
                            </span>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-3 h-3 text-muted-foreground/75" />
                            Expires {fmtExpiry(offer.valid_until)}
                        </span>
                    </div>

                    {!isApplicable && neededMore > 0 && (
                        <p className="text-[10px] text-warning mt-1 flex items-center gap-0.5 font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Add ₹{neededMore.toLocaleString('en-IN')} more to unlock
                        </p>
                    )}
                </div>

                {/* Right action */}
                <div className="flex-shrink-0 flex items-center self-center">
                    {isCurrentlyApplied ? (
                        <CheckCircle className="w-5 h-5 text-success" />
                    ) : isApplicable ? (
                        isValidating
                            ? <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            : <span className="text-xs font-bold text-offer hover:underline">Apply</span>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

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

    const [offers, setOffers] = useState([]);
    const [offersLoading, setOffersLoading] = useState(true);
    const [showAllOffers, setShowAllOffers] = useState(false);

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
        offersAPI.getActive()
            .then(data => setOffers(data.offers ?? []))
            .catch(() => setOffers([]))
            .finally(() => setOffersLoading(false));
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

    const applyOffer = async (code) => {
        if (!code || !settingsLoaded) return;
        setCouponError(null);
        setIsValidating(true);
        try {
            const result = await offersAPI.validateOffer({
                offer_code: code.trim().toUpperCase(),
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

    const handleApplyCoupon = () => applyOffer(couponInput.trim());
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

    // Sort: applicable first, then ineligible
    const sortedOffers = [...offers].sort((a, b) => {
        const aOk = subtotal >= (a.min_booking_amount || 0);
        const bOk = subtotal >= (b.min_booking_amount || 0);
        return aOk === bOk ? 0 : aOk ? -1 : 1;
    });
    const visibleOffers = showAllOffers ? sortedOffers : sortedOffers.slice(0, 3);
    const applicableCount = sortedOffers.filter(o => subtotal >= (o.min_booking_amount || 0)).length;

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Sticky Header - Glassmorphic Frosted Bar */}
            <div className="sticky top-0 z-35 backdrop-blur-md bg-background/80 border-b border-border/60 shadow-sm transition-all duration-300">
                <div className="container mx-auto px-3 sm:px-6 lg:px-14 py-2.5">
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={handleCancel}
                            disabled={isProcessing}
                            className="p-2 bg-secondary/40 hover:bg-secondary/70 border border-border/60 rounded-xl transition flex-shrink-0 cursor-pointer custom-hover"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="w-4 h-4 text-foreground" />
                        </button>

                        {state.posterUrl && (
                            <div className="h-14 w-10 sm:h-16 sm:w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border/60 shadow-sm">
                                <img
                                    src={state.posterUrl}
                                    alt={state.movieTitle}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        )}

                        <div className="flex-1 min-w-0">
                            <h1 className="text-sm sm:text-base font-bold leading-tight truncate text-foreground">
                                {state.movieTitle}
                                <span className="text-xs font-medium text-muted-foreground ml-2 hidden sm:inline-block font-sans">
                                    ({state.language || 'Tamil'})
                                </span>
                            </h1>
                            <p className="text-xs text-muted-foreground truncate font-medium">
                                {state.cinemaName}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm shadow-primary/20">
                                    {state.startTime}
                                </span>
                                <span className="text-[10px] font-semibold text-muted-foreground hidden sm:inline-block">
                                    {state.showDate}
                                </span>
                                <span className="text-[10px] font-bold border border-border rounded px-1.5 py-0.5 text-muted-foreground bg-secondary/20">
                                    {state.screenType || '2D'}
                                </span>
                            </div>
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

            {/* ── Body ── */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-6">
                <div className="flex flex-col lg:flex-row gap-6 items-start max-w-4xl mx-auto lg:max-w-none">

                    {/* ════ LEFT: Order Summary ════ */}
                    <div className="w-full lg:w-[45%] bg-card/75 rounded-2xl border border-border/80 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 lg:sticky lg:top-20">

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-border bg-gradient-to-r from-primary/5 to-secondary/5">
                            <div className="flex justify-between items-start gap-3">
                                <div className="min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        {state.posterUrl && (
                                            <div className="h-16 w-11 rounded-lg overflow-hidden flex-shrink-0 bg-muted border border-border shadow-sm">
                                                <img src={state.posterUrl} alt={state.movieTitle} className="w-full h-full object-cover" />
                                            </div>
                                        )}
                                        <h3 className="font-bold text-base truncate">
                                            {state.movieTitle}
                                        </h3>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                            <Calendar className="w-3.5 h-3.5 text-primary/80" />{state.showDate}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                                            <Clock className="w-3.5 h-3.5 text-primary/80" />{state.startTime}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1.5 font-semibold">
                                        {state.language} &bull; {state.screenType}
                                    </p>
                                </div>
                                <span className="text-xs font-bold bg-offer/10 text-offer border border-offer/20 px-3 py-1 rounded-full flex items-center gap-1 flex-shrink-0">
                                    <Ticket className="w-3.5 h-3.5" />
                                    {numTickets} {numTickets === 1 ? 'Ticket' : 'Tickets'}
                                </span>
                            </div>
                        </div>

                        {/* Seat info */}
                        <div className="px-5 py-4 border-b border-border bg-secondary/10">
                            <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1.5 font-semibold uppercase tracking-wider">
                                <Armchair className="w-3.5 h-3.5 text-primary/80" /> Seats Booked
                            </p>
                            <p className="text-base font-bold font-mono tracking-wider text-foreground">{seatDisplay}</p>
                            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-muted-foreground/75" />{state.cinemaName}
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
                                <span className="font-bold text-sm text-foreground">Amount Payable</span>
                                <span className="font-bold text-lg font-mono text-foreground">
                                    {settingsLoaded ? `₹${grandTotal.toLocaleString('en-IN')}` : '...'}
                                </span>
                            </div>
                        </div>

                        {/* Cancel link */}
                        <div className="px-5 pb-4 border-t border-border pt-3">
                            <button
                                onClick={handleCancel}
                                disabled={isProcessing}
                                className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                                <X className="w-3 h-3" /> Cancel and release seats
                            </button>
                        </div>
                    </div>

                    {/* ════ RIGHT: Payment + Offers ════ */}
                    <div className="w-full lg:w-[55%] space-y-5">

                        {/* ── Offers panel ── */}
                        {(offersLoading || offers.length > 0) && (
                            <div className="bg-card/75 rounded-2xl border border-border/80 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300">
                                <div className="px-5 pt-4.5 pb-3.5 border-b border-border/60 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-offer" />
                                        <h2 className="text-sm font-bold text-foreground">Available Offers</h2>
                                        {!offersLoading && applicableCount > 0 && (
                                            <span className="text-[10px] font-bold bg-offer/15 text-offer px-2 py-0.5 rounded-full">
                                                {applicableCount} applicable
                                            </span>
                                        )}
                                    </div>
                                    {!offersLoading && appliedOffer && (
                                        <span className="text-xs text-success font-semibold flex items-center gap-1">
                                            <CheckCircle className="w-3.5 h-3.5" /> Applied
                                        </span>
                                    )}
                                </div>

                                <div className="px-5 py-5 space-y-3">
                                    {offersLoading ? (
                                        /* skeleton */
                                        [1, 2].map(i => (
                                            <div key={i} className="rounded-xl border border-border bg-secondary/20 h-20 animate-pulse" />
                                        ))
                                    ) : offers.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">No offers available right now.</p>
                                    ) : (
                                        <>
                                            {visibleOffers.map(offer => {
                                                const minAmt = offer.min_booking_amount || 0;
                                                const isApplicable = subtotal >= minAmt;
                                                const neededMore = isApplicable ? 0 : +(minAmt - subtotal).toFixed(2);
                                                return (
                                                    <OfferCard
                                                        key={offer.id}
                                                        offer={offer}
                                                        isApplicable={isApplicable}
                                                        neededMore={neededMore}
                                                        isApplied={!!appliedOffer}
                                                        appliedOfferCode={appliedOffer?.offer_code}
                                                        onApply={applyOffer}
                                                        isValidating={isValidating}
                                                    />
                                                );
                                            })}

                                            {sortedOffers.length > 3 && (
                                                <button
                                                    onClick={() => setShowAllOffers(v => !v)}
                                                    className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 pt-1 transition-colors cursor-pointer"
                                                >
                                                    {showAllOffers ? (
                                                        <><ChevronUp className="w-3.5 h-3.5" /> Show less</>
                                                    ) : (
                                                        <><ChevronDown className="w-3.5 h-3.5" /> {sortedOffers.length - 3} more offers</>
                                                    )}
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── Payment card ── */}
                        <div className="bg-card/40 backdrop-blur-md rounded-2xl border border-border/80 overflow-hidden shadow-premium hover:shadow-lg transition-all duration-300">
                            <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
                                <div className="p-2 bg-success/10 text-success rounded-xl">
                                    <Lock className="w-4 h-4" />
                                </div>
                                <div>
                                    <span className="text-[9px] font-extrabold text-success tracking-wider uppercase block mb-0.5">SECURE CHECKOUT</span>
                                    <h2 className="text-sm font-bold text-foreground">Secure Payment</h2>
                                </div>
                            </div>

                            <div className="px-5 py-5 space-y-5">

                                {/* Razorpay branding */}
                                <div className="relative overflow-hidden flex items-center gap-4 p-4 rounded-xl border border-info/20 bg-gradient-to-br from-info/10 to-info/5 shadow-inner">
                                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-info/10 pointer-events-none blur-xl" />
                                    
                                    <div className="w-11 h-11 rounded-xl bg-info flex items-center justify-center flex-shrink-0 shadow-md shadow-info/20">
                                        <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.5 1L5 14h7L8 23l11-13h-8l3.5-9z" />
                                        </svg>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <span className="text-sm font-extrabold text-info tracking-tight">Razorpay Secure</span>
                                            <span className="text-[9px] font-bold bg-success/15 text-success border border-success/20 px-2 py-0.5 rounded-full uppercase tracking-wider">PCI-DSS</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed font-semibold">
                                            256-bit SSL Encrypted Connection
                                        </p>
                                    </div>
                                </div>

                                {/* Payment method chips */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2.5 font-bold uppercase tracking-wider">Accepted payment methods</p>
                                    <div className="flex flex-wrap gap-2">
                                        <PaymentPill icon={<CreditCard className="w-4 h-4" />} label="Cards" />
                                        <PaymentPill icon={<Smartphone className="w-4 h-4" />} label="UPI" />
                                        <PaymentPill icon={<Wallet className="w-4 h-4" />} label="Wallets" />
                                        <PaymentPill icon={<Building2 className="w-4 h-4" />} label="Net Banking" />
                                        <PaymentPill icon={<CreditCard className="w-4 h-4 text-warning" />} label="EMI" />
                                    </div>
                                </div>

                                {/* Coupon / Offer Code */}
                                <div>
                                    <p className="text-xs text-muted-foreground mb-2.5 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Tag className="w-3.5 h-3.5 text-offer" />
                                        Coupon / Offer Code
                                    </p>

                                    {appliedOffer ? (
                                        <div className="flex items-center justify-between gap-2 px-3.5 py-3 rounded-xl border border-dashed border-success/40 bg-success/5 shadow-inner shadow-success/5 animate-in fade-in duration-200">
                                            <div className="flex items-center gap-2.5 min-w-0">
                                                <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                                                    <CheckCircle className="w-4.5 h-4.5 text-success" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-mono font-bold text-sm text-success tracking-wide">{appliedOffer.offer_code}</p>
                                                    <p className="text-xs text-muted-foreground font-semibold">₹{appliedOffer.discount_amount} discount applied</p>
                                                </div>
                                            </div>
                                            <button onClick={handleRemoveCoupon} className="text-muted-foreground hover:text-destructive transition p-2 rounded-lg hover:bg-destructive/10 flex-shrink-0 cursor-pointer">
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-1.5">
                                            <div className="flex gap-2">
                                                <div className="relative flex-1">
                                                    <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                                                    <input
                                                        type="text"
                                                        value={couponInput}
                                                        onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                                                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                        placeholder="Enter offer code"
                                                        className="w-full bg-secondary/20 border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-sm font-mono uppercase placeholder:normal-case placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-offer/40 focus:border-offer/60 transition"
                                                        disabled={isValidating || !settingsLoaded}
                                                    />
                                                </div>
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    disabled={!couponInput.trim() || isValidating || !settingsLoaded}
                                                    className="px-6 py-2.5 rounded-xl bg-offer hover:bg-offer/95 active:scale-[0.98] disabled:opacity-50 text-white text-sm font-semibold transition-all flex items-center gap-1.5 shadow-sm shadow-offer/20 hover:shadow-offer/30 cursor-pointer"
                                                >
                                                    {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                                                </button>
                                            </div>
                                            {couponError && (
                                                <p className="text-xs text-destructive flex items-center gap-1 mt-1 font-medium">
                                                    <AlertCircle className="w-3.5 h-3.5 text-destructive" />{couponError}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Amount to pay */}
                                <div className="rounded-xl bg-secondary/30 border border-border/50 px-4 py-4 flex items-center justify-between shadow-inner">
                                    <div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Total to pay</p>
                                        <p className="text-2xl font-black font-mono tracking-tight mt-1 text-foreground">
                                            {settingsLoaded
                                                ? `₹${grandTotal.toLocaleString('en-IN')}`
                                                : <span className="text-muted-foreground animate-pulse text-lg">Loading...</span>
                                            }
                                        </p>
                                    </div>
                                    {appliedOffer && (
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground line-through font-mono font-medium">₹{subtotal.toLocaleString('en-IN')}</p>
                                            <p className="text-xs text-success font-bold mt-0.5">−₹{discountAmount} saved</p>
                                        </div>
                                    )}
                                </div>

                                {/* Pay button */}
                                <button
                                    onClick={handlePay}
                                    disabled={isProcessing || !settingsLoaded}
                                    className="w-full bg-gradient-to-br from-primary to-[oklch(from_var(--primary)_l_calc(c*0.75)_h)] hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground py-4 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary/20 hover:shadow-primary/35 flex items-center justify-center gap-2 custom-hover cursor-pointer"
                                >
                                    {isProcessing ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...</>
                                    ) : (
                                        <><Lock className="w-4.5 h-4.5" />{settingsLoaded ? `Pay ₹${grandTotal.toLocaleString('en-IN')}` : 'Loading...'}</>
                                    )}
                                </button>

                                {/* Trust row */}
                                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 text-center sm:text-left border-t border-border/40">
                                    <div className="flex items-center gap-1.5 text-success">
                                        <Shield className="w-4 h-4 text-success" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">100% SECURE CHECKOUT</span>
                                    </div>
                                    <span className="hidden sm:inline text-muted-foreground/30">|</span>
                                    <p className="text-[10px] text-muted-foreground/80 leading-normal max-w-[240px] font-medium">
                                        Your payment information is encrypted and processed securely.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default OrderSummaryPage;
