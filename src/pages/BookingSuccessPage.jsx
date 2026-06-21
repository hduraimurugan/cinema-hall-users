import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle, Loader2, Download, CalendarDays, Clock, Ticket, Hash,
  CheckCircle2, XCircle, Copy, Check, MapPin, Monitor
} from 'lucide-react';
import { bookingAPI } from '../services/api';
import { toJpeg } from 'html-to-image';
import { QRCodeSVG } from 'qrcode.react';

const statusConfig = {
  confirmed: {
    label: 'Confirmed',
    icon: CheckCircle2,
    bg: 'bg-green-500/15',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-500/30',
    dot: 'bg-green-500',
  },
  cancelled: {
    label: 'Cancelled',
    icon: XCircle,
    bg: 'bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/30',
    dot: 'bg-red-500',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    bg: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'ring-blue-500/30',
    dot: 'bg-blue-500',
  },
};

function fmt(value) {
  return Number(value || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function StatusBadge({ status, config }) {
  const cfg = config[status] || config.confirmed;
  const Icon = cfg.icon || CheckCircle2;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text} ring-1 ${cfg.ring}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const BookingSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const paymentId = searchParams.get('payment_id');

    const ticketRef = useRef(null);
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(null);

    const copyText = (key, value) => {
        navigator.clipboard.writeText(value);
        setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

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
    const bookingShortId = booking.id?.substring(0, 8).toUpperCase();
    const totalAmount = Number(booking.total_amount || 0);

    return (
        <div className="min-h-screen bg-background py-12 px-4 text-foreground">
            <div className="max-w-lg mx-auto">

                {/* Success Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-flex items-center justify-center mb-5">
                        <div className="absolute w-24 h-24 rounded-full bg-success/20 animate-ping" />
                        <div className="relative w-20 h-20 rounded-full bg-success/15 flex items-center justify-center ring-4 ring-success/30">
                            <CheckCircle className="w-11 h-11 text-success" strokeWidth={2} />
                        </div>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight mb-1">Booking Confirmed!</h1>
                    <p className="text-muted-foreground text-sm">Your seats are locked in. Enjoy the show!</p>
                </div>

                {/* ── TICKET ── */}
                <div
                    ref={ticketRef}
                    className="rounded-2xl overflow-hidden shadow-lg border border-border"
                    style={{ fontFamily: 'system-ui, sans-serif' }}
                >
                    {/* Gradient header */}
                    <div
                        className="px-6 pt-6 pb-5 relative"
                        style={{
                            background: booking.booking_status === 'cancelled'
                                ? 'linear-gradient(135deg, #374151 0%, #1f2937 100%)'
                                : 'linear-gradient(135deg, #e11d48 0%, #be123c 60%, #9f1239 100%)',
                        }}
                    >
                        {/* Branding */}
                        <div className="flex items-center gap-2 mb-4 opacity-80">
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

                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, lineHeight: 1.25 }}>
                                    {booking.movie_title}
                                </h1>
                                {(booking.genre || booking.language || booking.duration_mins) && (
                                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
                                        {booking.language && (
                                            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{booking.language}</span>
                                        )}
                                        {booking.genre?.length > 0 && (
                                            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
                                                {Array.isArray(booking.genre) ? booking.genre.join(', ') : booking.genre}
                                            </span>
                                        )}
                                        {booking.duration_mins && (
                                            <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{booking.duration_mins} min</span>
                                        )}
                                    </div>
                                )}

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3">
                                    <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                        <CalendarDays size={13} />
                                        {showDate}
                                    </span>
                                    {showTime && (
                                        <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                            <Clock size={13} />
                                            {showTime}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                                    {booking.cinema_hall_name && (
                                        <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                            <MapPin size={13} />
                                            {booking.cinema_hall_name}
                                        </span>
                                    )}
                                    {booking.screen_name && (
                                        <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                                            <Monitor size={13} />
                                            {booking.screen_name}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Poster thumbnail */}
                            {booking.poster_url && (
                                <img
                                    src={booking.poster_url.startsWith('https://image.tmdb.org/')
                                        ? `${import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"}/api/movies/proxy-image?url=${encodeURIComponent(booking.poster_url)}`
                                        : booking.poster_url}
                                    alt={booking.movie_title}
                                    crossOrigin="anonymous"
                                    className="w-16 h-24 object-cover rounded-lg shadow-lg shrink-0"
                                    style={{ border: '2px solid rgba(255,255,255,0.2)' }}
                                />
                            )}
                        </div>
                    </div>

                    {/* Perforated divider */}
                    <div className="relative flex items-center bg-card" style={{ height: 24 }}>
                        <div
                            className="absolute -left-3 w-6 h-6 rounded-full bg-background border border-border"
                        />
                        <div
                            className="flex-1 mx-3"
                            style={{ borderTop: '2px dashed', borderColor: 'var(--border, #27272a)' }}
                        />
                        <div
                            className="absolute -right-3 w-6 h-6 rounded-full bg-background border border-border"
                        />
                    </div>

                    {/* Ticket body */}
                    <div className="bg-card px-6 pb-6">
                        {/* Booking ID + Status */}
                        <div className="grid grid-cols-2 gap-4 mb-5 pt-1">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1">
                                    <Hash size={11} /> Booking ID
                                </p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono font-bold text-lg tracking-wider">{bookingShortId}</p>
                                    <button
                                        onClick={() => copyText('id', booking.id)}
                                        className="text-muted-foreground hover:text-foreground transition-colors"
                                        title="Copy full ID"
                                    >
                                        {copied === 'id' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">Status</p>
                                <StatusBadge status={booking.booking_status} config={statusConfig} />
                            </div>
                        </div>

                        {/* Seats */}
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1">
                                <Ticket size={11} /> Seats
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {(booking.seat_labels || []).map((seat, idx) => (
                                    <span
                                        key={idx}
                                        className="px-3 py-1.5 rounded-lg text-sm font-bold bg-secondary text-secondary-foreground ring-1 ring-border"
                                    >
                                        {seat}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Total */}
                        <div className="flex items-center justify-between pb-5 border-b border-dashed border-border">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-0.5">Total Paid</p>
                                <p className="text-3xl font-extrabold tracking-tight">₹{fmt(totalAmount)}</p>
                            </div>
                            {/* QR code */}
                            <div className="bg-white p-2.5 rounded-xl shadow-sm ring-1 ring-zinc-200">
                                <QRCodeSVG value={booking.id} size={80} level="M" />
                            </div>
                        </div>

                        {/* Scan hint */}
                        <p className="text-xs text-muted-foreground mt-3 text-center">
                            Present this QR code at the cinema entrance for entry
                        </p>
                    </div>
                </div>

                {/* Email confirmation notice */}
                <div className="mt-5 flex items-start gap-3 bg-info/10 border border-info/20 rounded-xl px-4 py-3">
                    <span className="text-lg mt-0.5">📧</span>
                    <p className="text-sm text-info">
                        <span className="font-bold">Confirmation sent!</span>{' '}
                        A booking confirmation has been sent to your email.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="sm:col-span-1 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-primary/95 transition-all shadow-md shadow-primary/10 hover:shadow-primary/20 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        My Bookings
                    </button>
                    <button
                        onClick={handleDownload}
                        className="sm:col-span-1 flex items-center justify-center gap-2 bg-secondary text-foreground px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-secondary/80 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Download Ticket
                    </button>
                    <button
                        onClick={() => navigate('/movies')}
                        className="sm:col-span-1 bg-secondary text-foreground px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-secondary/80 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                        Book More
                    </button>
                </div>

                <p className="mt-8 text-center text-xs text-muted-foreground">
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
