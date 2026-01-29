import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

const BookingSuccessPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const booking = location.state?.booking;

    useEffect(() => {
        if (!booking) {
            navigate('/');
        }
    }, [booking, navigate]);

    if (!booking) {
        return null;
    }

    const seats = Array.isArray(booking.seats) ? booking.seats : JSON.parse(booking.seats || '[]');

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
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Booking ID</p>
                            <p className="font-semibold">{booking.id?.substring(0, 8)}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <span className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-semibold rounded-full">
                                {booking.status}
                            </span>
                        </div>
                    </div>

                    <div className="border-t border-border pt-4 mb-4">
                        <p className="text-sm text-muted-foreground mb-3">Seats</p>
                        <div className="flex flex-wrap gap-2">
                            {seats.map((seat, index) => (
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
                        onClick={() => navigate('/movies')}
                        className="flex-1 bg-secondary text-secondary-foreground px-6 py-3 rounded-lg font-semibold hover:bg-secondary/80"
                    >
                        Book More Tickets
                    </button>
                </div>

                {/* Download/Share Options (Optional Future Enhancement) */}
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
