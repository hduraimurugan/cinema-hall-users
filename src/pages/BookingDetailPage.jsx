import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CalendarDays, Clock, MapPin, Monitor,
  Ticket, Hash, CreditCard, Tag, Percent, Download,
  IndianRupee, CheckCircle2, XCircle, Clock3, Copy, Check,
  Film, QrCode,
} from 'lucide-react';
import { bookingAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { toJpeg } from 'html-to-image';

/* ─────────────────────────────────────── helpers ── */

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

const refundStatusConfig = {
  initiated: {
    label: 'Refund Initiated',
    bg: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'ring-amber-500/30',
    dot: 'bg-amber-500',
  },
  settled: {
    label: 'Refund Settled',
    bg: 'bg-green-500/15',
    text: 'text-green-600 dark:text-green-400',
    ring: 'ring-green-500/30',
    dot: 'bg-green-500',
  },
  failed: {
    label: 'Refund Failed',
    bg: 'bg-red-500/15',
    text: 'text-red-600 dark:text-red-400',
    ring: 'ring-red-500/30',
    dot: 'bg-red-500',
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

/* ─────────────────────────── skeleton ── */

const SkeletonBox = ({ className }) => (
  <div className={`bg-muted rounded-xl animate-pulse ${className}`} />
);

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-background px-4 py-8">
    <div className="max-w-2xl mx-auto space-y-6">
      <SkeletonBox className="h-8 w-32" />
      <SkeletonBox className="h-52 w-full" />
      <SkeletonBox className="h-36 w-full" />
      <SkeletonBox className="h-40 w-full" />
    </div>
  </div>
);

/* ──────────────────────────── main ── */

const BookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const ticketRef = useRef(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    bookingAPI.getBookingById(id)
      .then(data => setBooking(data.booking))
      .catch(err => setError(err?.error || 'Failed to load booking'))
      .finally(() => setLoading(false));
  }, [id]);

  const copyText = (key, value) => {
    navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleDownloadTicket = async () => {
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

  if (loading) return <LoadingSkeleton />;

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Ticket className="w-7 h-7 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">{error || 'Booking not found'}</p>
          <button
            onClick={() => navigate('/bookings')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bookings
          </button>
        </div>
      </div>
    );
  }

  const showDate = booking.show_date
    ? new Date(booking.show_date).toLocaleDateString('en-IN', { dateStyle: 'long' })
    : '';
  const showTime = booking.start_time ? booking.start_time.slice(0, 5) : '';
  const bookedAt = booking.created_at
    ? new Date(booking.created_at).toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '';
  const bookingShortId = booking.id?.substring(0, 8).toUpperCase();

  const totalAmount = Number(booking.total_amount || 0);
  const convenienceFee = Number(booking.convenience_fee || 0);
  const gstAmount = Number(booking.gst_amount || 0);
  const discountAmount = Number(booking.discount_amount || 0);
  const seatSubtotal = totalAmount + discountAmount - convenienceFee - gstAmount;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-5">

        {/* Back button */}
        <button
          onClick={() => navigate('/bookings')}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          My Bookings
        </button>

        {/* ── Hero ticket card ── */}
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

        {/* ── Action buttons ── */}
        <div className="flex gap-3">
          <button
            onClick={() => {
              const url = booking.cinema_hall_latitude && booking.cinema_hall_longitude
                ? `https://www.google.com/maps/dir/?api=1&destination=${booking.cinema_hall_latitude},${booking.cinema_hall_longitude}`
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((booking.cinema_hall_name || '') + ' ' + (booking.cinema_hall_location || ''))}`
              window.open(url, '_blank', 'noopener,noreferrer')
            }}
            className="flex-1 flex items-center justify-center gap-2 border border-primary/40 text-primary px-5 py-3.5 rounded-xl font-semibold text-sm hover:bg-primary/10 transition-colors"
          >
            <MapPin className="w-4 h-4" />
            Get Directions
          </button>
          {booking.booking_status !== 'cancelled' && (
            <button
              onClick={handleDownloadTicket}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 px-5 py-3.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Ticket
            </button>
          )}
        </div>

        {/* ── Price breakdown ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-muted-foreground" />
              Price Breakdown
            </h2>
          </div>
          <div className="px-5 py-4 space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Ticket className="w-3.5 h-3.5" />
                Seats ({(booking.seat_labels || []).length} × ticket)
              </span>
              <span className="font-medium">₹{fmt(seatSubtotal)}</span>
            </div>
            {convenienceFee > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" />
                  Convenience Fee
                </span>
                <span className="font-medium">₹{fmt(convenienceFee)}</span>
              </div>
            )}
            {gstAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5" />
                  GST
                </span>
                <span className="font-medium">₹{fmt(gstAmount)}</span>
              </div>
            )}
            {discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5" />
                  {booking.offer_title ? `Offer: ${booking.offer_title}` : 'Offer Discount'}
                </span>
                <span className="font-semibold text-green-600 dark:text-green-400">− ₹{fmt(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="font-bold">Total</span>
              <span className="text-xl font-extrabold">₹{fmt(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ── Refund info (cancelled bookings) ── */}
        {booking.booking_status === 'cancelled' && booking.refund_status && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                Refund Details
              </h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <StatusBadge status={booking.refund_status} config={refundStatusConfig} />
              </div>
              {booking.refund_amount && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="font-semibold">₹{fmt(booking.refund_amount)}</span>
                </div>
              )}
              {booking.razorpay_refund_id && (
                <div className="flex items-start justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Razorpay Refund ID</span>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono text-xs truncate">{booking.razorpay_refund_id}</span>
                    <button
                      onClick={() => copyText('refund', booking.razorpay_refund_id)}
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      {copied === 'refund' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
              )}
              {booking.refund_initiated_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Initiated</span>
                  <span>{new Date(booking.refund_initiated_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
              )}
              {booking.refund_settled_at && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Settled</span>
                  <span>{new Date(booking.refund_settled_at).toLocaleString('en-IN', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}</span>
                </div>
              )}
              {booking.refund_failure_reason && (
                <div className="flex items-start justify-between text-sm gap-3">
                  <span className="text-muted-foreground shrink-0">Failure Reason</span>
                  <span className="text-red-500 dark:text-red-400 text-right">{booking.refund_failure_reason}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Payment info ── */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              Payment Info
            </h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            {booking.payment_id && (
              <div className="flex items-start justify-between text-sm gap-3">
                <span className="text-muted-foreground shrink-0">Payment ID</span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs truncate">{booking.payment_id}</span>
                  <button
                    onClick={() => copyText('payment', booking.payment_id)}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    {copied === 'payment' ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            )}
            {bookedAt && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Booked At</span>
                <span>{bookedAt}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default BookingDetailPage;
