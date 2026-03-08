import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, Download, CalendarDays, Clock, Ticket, Hash } from 'lucide-react';
import { bookingAPI } from '../services/api';
import { toJpeg } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

const BookingSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const paymentId = searchParams.get('payment_id');

    const ticketRef = useRef(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const handleDownload = async () => {
        if (!ticketRef.current) return;
        const html = document.documentElement;
        const wasDark = html.classList.contains('dark');
        try {
            if (wasDark) html.classList.remove('dark');
            const dataUrl = await toJpeg(ticketRef.current, {
                quality: 0.97,
                pixelRatio: 3,
                backgroundColor: '#ffffff',
            });
            if (wasDark) html.classList.add('dark');
            const link = document.createElement('a');
            link.download = `ticket-${booking.id?.substring(0, 8)}.jpg`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            if (wasDark) html.classList.add('dark');
            console.error('Failed to download ticket:', err);
        }
    };

    useEffect(() => {
        if (!paymentId) {
            navigate('/');
            return;
        }
        bookingAPI.getBookingByPaymentId(paymentId)
            .then(data => setBooking(data.booking))
            .catch(err => setError(err?.error || 'Failed to load booking details'))
            .finally(() => setLoading(false));
    }, [paymentId, navigate]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center px-4">
                <div className="text-center">
                    <p className="text-destructive font-semibold mb-4">{error}</p>
                    <button
                        onClick={() => navigate('/bookings')}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90"
                    >
                        View My Bookings
                    </button>
                </div>
            </div>
        );
    }

    const showDate = booking.show_date
        ? new Date(booking.show_date).toLocaleDateString('en-IN', { dateStyle: 'long' })
        : '';
    const showTime = booking.start_time ? booking.start_time.slice(0, 5) : '';
    const bookingId = booking.id?.substring(0, 8).toUpperCase();

    return (
        <div className="min-h-screen bg-background py-10 px-4">
            <div className="max-w-lg mx-auto">

                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center mb-5">
                        <div className="absolute w-24 h-24 rounded-full bg-green-500/20 animate-ping" />
                        <div className="relative w-20 h-20 rounded-full bg-green-500/15 flex items-center justify-center ring-4 ring-green-500/30">
                            <CheckCircle className="w-11 h-11 text-green-500" strokeWidth={2} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-1">Booking Confirmed!</h1>
                    <p className="text-muted-foreground text-sm">Your seats are locked in. Enjoy the show!</p>
                </div>

                {/* ── TICKET ── */}
                <div
                    ref={ticketRef}
                    className="bg-transparent dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border-0 border-border"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                    {/* Ticket Header — gradient banner */}
                    <div
                        className="px-6 pt-6 pb-5"
                        style={{
                            background: 'linear-gradient(135deg, #e11d48 0%, #be123c 60%, #9f1239 100%)',
                        }}
                    >
                        <div className="flex items-center gap-2 mb-3 opacity-80">
                            <div
                                className="w-6 h-6 rounded flex items-center justify-center"
                                style={{ background: 'rgba(255,255,255,0.25)' }}
                            >
                                <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>C</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 700, letterSpacing: '0.12em' }}>
                                CINEMAX
                            </span>
                        </div>
                        <h2 style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', margin: 0, lineHeight: 1.2 }}>
                            {booking.movie_title}
                        </h2>
                        <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                <CalendarDays size={13} />
                                {showDate}
                            </span>
                            {showTime && (
                                <span className="flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                    <Clock size={13} />
                                    {showTime}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Perforated divider */}
                    <div className="relative flex items-center" style={{ height: 24 }}>
                        <div
                            className="absolute -left-3 w-6 h-6 rounded-full"
                            style={{ background: 'var(--background, #09090b)', border: '1px solid var(--border)' }}
                        />
                        <div
                            className="flex-1 mx-3"
                            style={{
                                borderTop: '2px dashed',
                                borderColor: 'var(--border, #27272a)',
                            }}
                        />
                        <div
                            className="absolute -right-3 w-6 h-6 rounded-full"
                            style={{ background: 'var(--background, #09090b)', border: '1px solid var(--border)' }}
                        />
                    </div>

                    {/* Ticket Body */}
                    <div className="px-6 pb-5">
                        {/* Booking ID + Status */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                                    <Hash size={11} /> Booking ID
                                </p>
                                <p className="font-mono font-bold text-lg tracking-wider">{bookingId}</p>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Status</p>
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-500/15 text-green-600 dark:text-green-400 ring-1 ring-green-500/30">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                                    {booking.booking_status?.charAt(0).toUpperCase() + booking.booking_status?.slice(1)}
                                </span>
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                                <Ticket size={11} /> Seats
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(booking.seat_labels || []).map((seat, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 rounded-lg text-sm font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 ring-1 ring-zinc-200 dark:ring-zinc-700"
                                    >
                                        {seat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex items-end justify-between pb-4 border-b border-dashed border-border">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Total Amount</p>
                                <p className="text-xs text-muted-foreground/70">
                                    {booking.payment_id}
                                </p>
                            </div>
                            <p className="text-3xl font-extrabold tracking-tight">
                                ₹{Number(booking.total_amount).toFixed(2)}
                            </p>
                        </div>

                        {/* QR Stub */}
                        <div className="pt-4 flex items-center gap-5">
                            <div className="bg-white p-2.5 rounded-xl shadow-sm ring-1 ring-zinc-200">
                                <QRCodeSVG value={booking.id} size={90} level="M" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Scan to verify</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Present this QR code<br />at the cinema entrance.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Email confirmation notice */}
                <div className="mt-4 flex items-start gap-3 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3">
                    <span className="text-lg mt-0.5">📧</span>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        <span className="font-semibold">Confirmation sent!</span>{' '}
                        A booking confirmation has been sent to your email.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="sm:col-span-1 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-semibold text-sm hover:bg-primary/90 transition-colors"
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={handleDownload}
                        className="sm:col-span-1 flex items-center justify-center gap-2 bg-zinc-800 dark:bg-zinc-700 text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-zinc-700 dark:hover:bg-zinc-600 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download Ticket
                    </button>
                    <button
                        onClick={() => navigate('/movies')}
                        className="sm:col-span-1 bg-secondary text-secondary-foreground px-5 py-3 rounded-xl font-semibold text-sm hover:bg-secondary/80 transition-colors"
                    >
                        Book More
                    </button>
                </div>

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    Need help? Contact us at{' '}
                    <a href="mailto:support@cinema.com" className="underline underline-offset-2 hover:text-foreground transition-colors">
                        support@cinema.com
                    </a>
                </p>
            </div>
        </div>
    );
};

export default BookingSuccessPage;
