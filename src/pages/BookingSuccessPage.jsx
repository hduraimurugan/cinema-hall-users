import { useSearchParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { CheckCircle, Loader2, Download } from 'lucide-react';
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
            const dataUrl = await toJpeg(ticketRef.current, { quality: 0.95, pixelRatio: 2, backgroundColor: '#ffffff' });
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

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-8">
            <div className="max-w-2xl w-full">
                {/* Success Icon */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
                        <CheckCircle className="w-16 h-16 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Booking Confirmed!</h1>
                    <p className="text-muted-foreground">
                        Your ticket has been successfully booked
                    </p>
                </div>

                {/* Booking Details Card */}
                <div ref={ticketRef} className="bg-card border border-border rounded-lg p-6 mb-6">
                    {/* Movie & Show Info */}
                    <div className="mb-4 pb-4 border-b border-border">
                        <p className="text-lg font-bold">{booking.movie_title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                            {booking.show_date
                                ? new Date(booking.show_date).toLocaleDateString('en-IN', { dateStyle: 'long' })
                                : ''}
                            {booking.start_time ? ` • ${booking.start_time.slice(0, 5)}` : ''}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Booking ID</p>
                            <p className="font-semibold">{booking.id?.substring(0, 8)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                {booking.booking_status?.charAt(0).toUpperCase() + booking.booking_status?.slice(1)}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 mb-4">
                        <p className="text-sm text-muted-foreground mb-3">Seats</p>
                        <div className="flex flex-wrap gap-2">
                            {(booking.seat_labels || []).map((seat, index) => (
                                <span
                                    key={index}
                                    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg font-semibold"
                                >
                                    {seat}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="border-t border-border pt-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-muted-foreground">Total Amount</p>
                            <p className="text-2xl font-bold">₹{booking.total_amount}</p>
                        </div>
                        {booking.payment_id && (
                            <p className="text-xs text-muted-foreground">
                                Payment ID: {booking.payment_id}
                            </p>
                        )}
                    </div>

                    <div className="border-t border-border pt-4 flex flex-col items-center">
                        <div className="bg-white p-2 rounded">
                            <QRCodeSVG value={booking.id} size={120} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Scan to verify</p>
                    </div>
                </div>

                {/* Info Message */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-400">
                        <span className="font-semibold">📧 Confirmation sent!</span> A booking confirmation has been sent to your email. Please show this at the cinema entrance.
                    </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={() => navigate('/bookings')}
                        className="flex-1 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-primary/90"
                    >
                        View My Bookings
                    </button>
                    <button
                        onClick={handleDownload}
                        className="flex-1 flex items-center justify-center gap-2 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80"
                    >
                        <Download className="w-4 h-4" />
                        Download Ticket
                    </button>
                    <button
                        onClick={() => navigate('/movies')}
                        className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80"
                    >
                        Book More Tickets
                    </button>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                        Need help? Contact support at support@cinema.com
                    </p>
                </div>
            </div>
        </div>
    );
};

export default BookingSuccessPage;
