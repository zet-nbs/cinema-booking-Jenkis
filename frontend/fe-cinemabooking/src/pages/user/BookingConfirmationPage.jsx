import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CalendarDays, CheckCircle, MapPin, QrCode, Ticket } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import BookingProgress from '@/components/BookingProgress';
import { bookingService } from '@/services/bookingService';
export default function BookingConfirmationPage() {
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const bookingId = bookingService.getConfirmedBookingId();
        if (bookingId) {
            bookingService.getBookingById(bookingId)
                .then((data) => {
                setBooking(data);
                bookingService.clearConfirmedBookingId();
            })
                .catch(() => navigate('/my-bookings'))
                .finally(() => setLoading(false));
        }
        else {
            setLoading(false);
            navigate('/my-bookings');
        }
    }, [navigate]);
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    return (<div className="min-h-screen bg-dark-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4"/>
            <span>Home</span>
          </Link>
          <BookingProgress currentStep="finish"/>
          <div></div>
        </div>
      </header>
      
      <main className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 lg:px-8">
        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6"/>
        <p className="section-eyebrow mb-3">Payment successful</p>
        <h1 className="text-4xl font-display font-bold mb-2">Your Ticket Is Ready</h1>
        <p className="text-slate-400 mb-8">Show this e-ticket at the cinema entrance before entering the studio.</p>
        
        {booking && (<div className="overflow-hidden rounded-xl border border-white/10 bg-dark-900 text-left shadow-2xl shadow-black/30">
            <div className="grid grid-cols-1 md:grid-cols-[180px_1fr]">
              <img src={booking.showtime.movie.poster || booking.showtime.movie.poster_url} alt={booking.showtime.movie.title} className="h-full min-h-64 w-full object-cover"/>
              <div className="p-6">
                <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row">
                  <div>
                    <span className="cinema-badge mb-3 bg-primary-600/90">
                      <Ticket className="mr-1 h-3 w-3"/>
                      E-ticket
                    </span>
                    <h2 className="text-2xl font-bold">{booking.showtime.movie.title}</h2>
                    <p className="text-slate-400">{Array.isArray(booking.showtime.movie.genre) ? booking.showtime.movie.genre.join(', ') : booking.showtime.movie.genre} • {booking.showtime.movie.duration} mins</p>
                  </div>
                  <div className="rounded-lg bg-white p-3">
                    <div className="grid h-24 w-24 grid-cols-5 gap-1">
                      {Array.from({ length: 25 }).map((_, index) => (<span key={index} className={`${index % 2 === 0 || index % 7 === 0 ? 'bg-dark-950' : 'bg-slate-200'} rounded-sm`}/>))}
                    </div>
                  </div>
                </div>
                <div className="my-5 border-t border-dashed border-white/20"/>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <div><p className="text-sm text-slate-400">Cinema</p><p className="flex items-center gap-1 font-semibold"><MapPin className="h-4 w-4 text-accent-400"/> {booking.showtime.cinema_name || booking.showtime.bioskop?.name || '-'}</p></div>
                  <div><p className="text-sm text-slate-400">Studio</p><p className="font-semibold">{booking.showtime.hall?.hall_name || '-'}</p></div>
                  <div><p className="text-sm text-slate-400">Date</p><p className="flex items-center gap-1 font-semibold"><CalendarDays className="h-4 w-4 text-accent-400"/> {new Date(booking.showtime.show_date).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-slate-400">Time</p><p className="font-semibold">{booking.showtime.start_time}</p></div>
                  <div><p className="text-sm text-slate-400">Seats</p><p className="font-semibold">{booking.selected_seats.join(', ')}</p></div>
                  <div><p className="text-sm text-slate-400">Booking ID</p><p className="font-semibold">#{booking._id.slice(-6).toUpperCase()}</p></div>
                </div>
                <div className="mt-6 flex items-center justify-between rounded-lg bg-dark-950 p-4">
                  <span className="text-slate-400">Total Paid</span>
                  <span className="text-xl font-black text-accent-300">IDR {booking.total_amount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>)}
        
        <div className="mt-8 flex justify-center">
            <Link to="/my-bookings" className="btn btn-primary w-full max-w-xs text-lg">
                <QrCode className="h-5 w-5"/>
                View My Bookings
            </Link>
        </div>
      </main>
    </div>);
}
