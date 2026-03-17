import { useState, useEffect } from 'react';
import { Tag, Copy, Check, CalendarDays, IndianRupee, Users, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { offersAPI } from '../services/api';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import dayjs from 'dayjs';

const OffersPage = () => {
    const { customer } = useCustomerAuth();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [copiedCode, setCopiedCode] = useState(null);

    useEffect(() => {
        if (!customer) {
            setLoading(false);
            return;
        }
        offersAPI.getActive()
            .then(data => setOffers(data.offers || []))
            .catch(() => setOffers([]))
            .finally(() => setLoading(false));
    }, [customer]);

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code).then(() => {
            setCopiedCode(code);
            toast.success(`Copied "${code}" to clipboard!`);
            setTimeout(() => setCopiedCode(null), 2000);
        });
    };

    const formatDiscount = (offer) => {
        if (offer.discount_type === 'fixed') return `₹${offer.discount_value} OFF`;
        const base = `${offer.discount_value}% OFF`;
        return offer.max_discount_amount ? `${base} up to ₹${offer.max_discount_amount}` : base;
    };

    const isExpiringSoon = (validUntil) => {
        return dayjs(validUntil).diff(dayjs(), 'day') <= 3;
    };

    if (!customer) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-10">
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                        <Tag className="w-12 h-12 opacity-30" />
                        <p className="text-base font-medium">Please log in to view available offers</p>
                        <p className="text-sm">Sign in to access exclusive deals and discounts</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-14 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="p-2 rounded-lg bg-violet-500/10">
                            <Tag className="w-5 h-5 text-violet-500" />
                        </div>
                        <h1 className="text-2xl font-bold">Offers & Discounts</h1>
                    </div>
                    <p className="text-sm text-muted-foreground ml-1">
                        Exclusive deals available for your account. Copy a code and apply it at checkout.
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3 animate-pulse">
                                <div className="h-5 w-2/3 bg-secondary rounded" />
                                <div className="h-8 w-1/2 bg-secondary rounded" />
                                <div className="h-4 w-full bg-secondary rounded" />
                                <div className="h-10 bg-secondary rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : offers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                        <Tag className="w-12 h-12 opacity-30" />
                        <p className="text-base font-medium">No active offers available right now</p>
                        <p className="text-sm">Check back later for exciting deals!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {offers.map(offer => (
                            <div key={offer.id} className="rounded-xl border border-border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                {/* Top color band */}
                                <div className="h-1.5 bg-gradient-to-r from-violet-500 to-purple-600" />

                                <div className="p-5">
                                    {/* Title + expiry badge */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <h3 className="font-semibold text-base leading-tight">{offer.title}</h3>
                                        {isExpiringSoon(offer.valid_until) && (
                                            <span className="flex-shrink-0 flex items-center gap-1 text-xs bg-amber-500/15 text-amber-400 border border-amber-500/25 px-2 py-0.5 rounded-full font-medium">
                                                <Clock className="w-3 h-3" /> Ending soon
                                            </span>
                                        )}
                                    </div>

                                    {/* Discount value */}
                                    <div className="text-2xl font-bold text-violet-500 mb-2">
                                        {formatDiscount(offer)}
                                    </div>

                                    {/* Description */}
                                    {offer.description && (
                                        <p className="text-xs text-muted-foreground mb-3 leading-relaxed">{offer.description}</p>
                                    )}

                                    {/* Details */}
                                    <div className="space-y-1.5 mb-4">
                                        {offer.min_booking_amount > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <IndianRupee className="w-3 h-3 flex-shrink-0" />
                                                Min. booking ₹{offer.min_booking_amount}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CalendarDays className="w-3 h-3 flex-shrink-0" />
                                            Valid till {dayjs(offer.valid_until).format('DD MMM YYYY')}
                                        </div>
                                        {offer.user_eligibility === 'joined_after' && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Users className="w-3 h-3 flex-shrink-0" />
                                                For users joined after {dayjs(offer.user_joined_after).format('DD MMM YYYY')}
                                            </div>
                                        )}
                                        {offer.scope === 'hall' && offer.cinema_hall_name && (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Tag className="w-3 h-3 flex-shrink-0" />
                                                Valid at {offer.cinema_hall_name} only
                                            </div>
                                        )}
                                    </div>

                                    {/* Code + Copy button */}
                                    <button
                                        onClick={() => handleCopy(offer.code)}
                                        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 rounded-lg border border-dashed border-violet-500/40 bg-violet-500/5 hover:bg-violet-500/10 transition-colors group"
                                    >
                                        <span className="font-mono font-bold text-sm tracking-widest text-violet-500">
                                            {offer.code}
                                        </span>
                                        <span className="flex items-center gap-1 text-xs text-violet-500 font-medium">
                                            {copiedCode === offer.code ? (
                                                <><Check className="w-3.5 h-3.5" /> Copied!</>
                                            ) : (
                                                <><Copy className="w-3.5 h-3.5" /> Copy</>
                                            )}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OffersPage;
