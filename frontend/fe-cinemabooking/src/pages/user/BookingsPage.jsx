import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Clock, MapPin, Eye, X, CreditCard, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { bookingService } from '@/services/bookingService';
import { transactionService } from '@/services/transactionService';

/** Shows a live countdown (MM:SS) for how long until this pending booking expires. */
function PendingCountdown({ createdAt, onExpired }) {
    const EXPIRY_MS = 5 * 60 * 1000;
    const calc = useCallback(() => {
        const elapsed = Date.now() - new Date(createdAt).getTime();
        return Math.max(0, Math.ceil((EXPIRY_MS - elapsed) / 1000));
    }, [createdAt]);
    const [secs, setSecs] = useState(calc);

    useEffect(() => {
        if (secs === 0) { onExpired?.(); return; }
        const id = setInterval(() => {
            const remaining = calc();
            setSecs(remaining);
            if (remaining === 0) onExpired?.();
        }, 1000);
        return () => clearInterval(id);
    }, [secs, calc, onExpired]);

    const mm = String(Math.floor(secs / 60)).padStart(2, '0');
    const ss = String(secs % 60).padStart(2, '0');
    const urgent = secs <= 60;
    return (
        <span className={`inline-flex items-center gap-1 text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
            urgent ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-yellow-500/20 text-yellow-400'
        }`}>
            ⏱ {mm}:{ss} left
        </span>
    );
}

export default function BookingsPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (user) {
            fetchBookings();
        }
    }, [user]);
    const fetchBookings = async () => {
        if (!user)
            return;
        try {
            const [bookingsData, transactionsData] = await Promise.all([
                bookingService.getMyBookings(user.id),
                transactionService.getHistory().catch(() => [])
            ]);
            setBookings(bookingsData || []);
            setTransactions(transactionsData || []);
        }
        catch (error) {
            console.error('Error fetching bookings:', error);
            toast.error('Failed to load bookings');
        }
        finally {
            setLoading(false);
        }
    };
    const handleCancelBooking = async (bookingId) => {
        if (!confirm('Are you sure you want to cancel this booking?'))
            return;
        try {
            await bookingService.cancelBooking(bookingId);
            toast.success('Booking cancelled successfully');
            fetchBookings();
        }
        catch (error) {
            console.error('Error cancelling booking:', error);
            toast.error('Failed to cancel booking');
        }
    };
    const handleContinuePayment = (booking) => {
        const selectionData = {
            movieId: booking.showtime?.movie?._id || booking.showtime?.movie,
            showtimeId: booking.showtime?._id || booking.showtime,
            seats: booking.selected_seats || [],
            bookingId: booking._id,
            totalAmount: booking.total_amount,
        };
        sessionStorage.setItem('seatSelection', JSON.stringify(selectionData));
        navigate('/payment');
    };
    const getStatusBadge = (status) => {
        const baseClasses = 'status-badge';
        switch (status) {
            case 'confirmed':
                return `${baseClasses} status-confirmed`;
            case 'cancelled':
                return `${baseClasses} status-cancelled`;
            default:
                return `${baseClasses} status-pending`;
        }
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    return (<div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-8">My Bookings</h1>

        {bookings.length === 0 ? (<div className="text-center py-12">
            <p className="text-slate-400 text-lg mb-6">
              You don't have any bookings yet.
            </p>
            <Link to="/movies" className="btn btn-primary">
              Browse Movies
            </Link>
          </div>) : (<div className="space-y-6">
            {bookings.map((booking) => {
                const transaction = transactions.find(t => (t.bookingId?._id || t.bookingId) === booking._id);
                const cinemaName =
                  booking.showtime?.cinema_name ||
                  booking.showtime?.bioskop?.name ||
                  booking.showtime?.cinema?.name ||
                  '-';
                const studioName =
                  booking.showtime?.hall?.hall_name ||
                  booking.showtime?.studio ||
                  '-';
                return (<div key={booking._id} className="card p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-center">
                  <div className="flex items-start gap-5">
                    <img src={booking.showtime?.movie?.poster || booking.showtime?.movie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=100&h=150&fit=crop'} alt={booking.showtime?.movie?.title} className="w-16 h-24 object-cover rounded-lg"/>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-semibold mb-2">
                        {booking.showtime?.movie?.title}
                      </h3>
                      <div className="grid grid-cols-1 items-start gap-x-8 gap-y-3 text-sm leading-5 text-slate-400 sm:grid-cols-[minmax(190px,1.4fr)_120px_90px_minmax(120px,1fr)]">
                        <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2">
                          <MapPin className="mt-0.5 h-4 w-4"/>
                          <span className="min-w-0 leading-5">
                            <span className="block truncate">{cinemaName}</span>
                            <span className="block truncate">{studioName}</span>
                          </span>
                        </div>
                        <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2">
                          <Calendar className="mt-0.5 h-4 w-4"/>
                          <span>
                            {new Date(booking.showtime?.show_date || '').toLocaleDateString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-[18px_minmax(0,1fr)] items-start gap-2">
                          <Clock className="mt-0.5 h-4 w-4"/>
                          <span>{booking.showtime?.start_time}</span>
                        </div>
                        <div className="min-w-0 leading-5">
                          <span className="block truncate">Seats: {booking.selected_seats?.join(', ')}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        <span className={getStatusBadge(booking.status)}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                        {booking.status === 'pending' && booking.createdAt && (
                          <PendingCountdown
                            createdAt={booking.createdAt}
                            onExpired={fetchBookings}
                          />
                        )}
                        <span className="text-lg font-semibold text-primary-400">
                          IDR {booking.total_amount.toLocaleString()}
                        </span>
                        {transaction && (
                          <span className="flex items-center gap-1.5 text-sm text-slate-400 bg-dark-950/50 px-2.5 py-1 rounded-full border border-white/5">
                            <CreditCard className="h-3.5 w-3.5 text-accent-400"/>
                            <span>{transaction.paymentMethod}</span>
                            {transaction.status === 'success' && (
                              <span className="text-[10px] bg-green-500/20 text-green-400 font-bold px-1.5 py-0.5 rounded uppercase">
                                Paid
                              </span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    <Link to={`/tickets/${booking._id}`} className="btn btn-secondary flex items-center space-x-2">
                      <Eye className="h-4 w-4"/>
                      <span>View</span>
                    </Link>
                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleContinuePayment(booking)}
                        className="btn btn-primary flex items-center space-x-2"
                      >
                        <CreditCard className="h-4 w-4"/>
                        <span>Continue Payment</span>
                        <ArrowRight className="h-4 w-4"/>
                      </button>
                    )}
                    {(booking.status === 'confirmed' || booking.status === 'pending') && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        className="btn btn-danger flex items-center space-x-2"
                      >
                        <X className="h-4 w-4"/>
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>);
            })}
          </div>)}
      </div>
    </div>);
}
