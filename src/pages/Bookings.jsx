import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ticket, CalendarDays, Clock, MapPin, Monitor, QrCode } from 'lucide-react';
import { bookingAPI } from '../services/api';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const statusColors = {
  confirmed: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  completed: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
};

const BookingCard = ({ booking }) => {
  const navigate = useNavigate();
  const showDate = new Date(booking.show_date);
  const formattedDate = showDate.toLocaleDateString('en-IN', { dateStyle: 'long' });
  const formattedTime = booking.start_time ? booking.start_time.slice(0, 5) : '';

  return (
    <div
      className="bg-card border border-border rounded-lg p-5 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
      onClick={() => navigate(`/booking/success?payment_id=${booking.payment_id}`)}
    >
      <div className="flex items-start justify-between gap-3 mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-lg font-bold">{booking.movie_title}</p>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {formattedTime}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            {booking.cinema_hall_name && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {booking.cinema_hall_name}
              </span>
            )}
            {booking.screen_name && (
              <span className="flex items-center gap-1">
                <Monitor className="w-3.5 h-3.5" />
                {booking.screen_name}
              </span>
            )}
          </div>
        </div>
        <span className={`shrink-0 inline-block px-3 py-1 text-xs font-semibold rounded-full ${statusColors[booking.booking_status] || statusColors.confirmed}`}>
          {booking.booking_status?.charAt(0).toUpperCase() + booking.booking_status?.slice(1)}
        </span>
      </div>

      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">Seats</p>
        <div className="flex flex-wrap gap-2">
          {(booking.seat_labels || []).map((seat, idx) => (
            <span key={idx} className="px-3 py-1 bg-secondary text-secondary-foreground rounded-lg text-sm font-semibold">
              {seat}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Booking ID</p>
          <p className="text-sm font-mono font-semibold">{booking.id?.substring(0, 8)}</p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <button
                onClick={e => e.stopPropagation()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                Show QR
              </button>
            </DialogTrigger>
            <DialogContent onClick={e => e.stopPropagation()} className="max-w-xs">
              <DialogHeader>
                <DialogTitle>Ticket QR Code</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="bg-white p-3 rounded-lg">
                  <QRCodeSVG value={booking.id} size={180} />
                </div>
                <p className="text-sm font-semibold">{booking.movie_title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(booking.show_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  {booking.start_time ? ` • ${booking.start_time.slice(0, 5)}` : ''}
                </p>
                <p className="text-xs text-muted-foreground font-mono">{booking.id}</p>
              </div>
            </DialogContent>
          </Dialog>
          <p className="text-xl font-bold">₹{booking.total_amount}</p>
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ label }) => (
  <div className="text-center py-16">
    <Ticket className="w-14 h-14 mx-auto text-muted-foreground/40 mb-4" />
    <p className="text-muted-foreground">No {label} bookings found</p>
  </div>
);

const SkeletonCard = () => (
  <div className="bg-card border border-border rounded-lg p-5 animate-pulse">
    <div className="h-5 bg-muted rounded w-48 mb-2" />
    <div className="h-4 bg-muted rounded w-64 mb-4 pb-4 border-b border-border" />
    <div className="flex gap-2 mb-4">
      <div className="h-8 bg-muted rounded w-12" />
      <div className="h-8 bg-muted rounded w-12" />
    </div>
    <div className="flex justify-between">
      <div className="h-4 bg-muted rounded w-24" />
      <div className="h-6 bg-muted rounded w-16" />
    </div>
  </div>
);

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    bookingAPI.getMyBookings()
      .then(data => setBookings(data.bookings || []))
      .catch(err => setError(err?.error || 'Failed to load bookings'))
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = bookings.filter(b => new Date(b.show_date) >= today);
  const past = bookings.filter(b => new Date(b.show_date) < today);
  const displayed = activeTab === 'upcoming' ? upcoming : past;

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Bookings</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted p-1 rounded-lg mb-6 w-fit">
          {['upcoming', 'past'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-md text-sm font-semibold transition-colors capitalize ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
              {!loading && (
                <span className="ml-1.5 text-xs">
                  ({tab === 'upcoming' ? upcoming.length : past.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col gap-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <p className="text-destructive font-semibold">{error}</p>
          </div>
        ) : displayed.length === 0 ? (
          <EmptyState label={activeTab} />
        ) : (
          <div className="flex flex-col gap-4">
            {displayed.map(booking => (
              <BookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookings;
