import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Landmark, QrCode, ShieldCheck, Wallet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import BookingProgress from '@/components/BookingProgress';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { transactionService } from '@/services/transactionService';

const paymentOptions = [
    {
        id: 'qris',
        label: 'QRIS',
        icon: QrCode,
        instruction: 'Pay via mobile banking app or e-wallet that supports QRIS.',
    },
    {
        id: 'wallet',
        label: 'E-wallet',
        icon: Wallet,
        instruction: 'Pay using GoPay, OVO, DANA, or ShopeePay.',
    },
    {
        id: 'va',
        label: 'Virtual Account',
        icon: Landmark,
        instruction: 'Transfer payment through a Virtual Account from your selected bank',
    },
    {
        id: 'card',
        label: 'Credit Card',
        icon: CreditCard,
        instruction: 'Pay using a Visa, MasterCard, or JCB credit or debit card. ',
    },
];

export default function PaymentPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [bookingData, setBookingData] = useState(null);
    const [paymentMethod, setPaymentMethod] = useState('qris');
    useEffect(() => {
        if (!bookingData) return undefined;

        const message = 'Are you sure you want to leave? Your booking may be cancelled.';

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = message;
            return message;
        };

        const handleDocumentClick = (event) => {
            const anchor = event.target.closest?.('a[href]');
            if (!anchor) return;
            if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
            if (anchor.target && anchor.target !== '_self') return;

            const nextUrl = new URL(anchor.href, window.location.href);
            if (nextUrl.origin !== window.location.origin) return;
            if (nextUrl.pathname === window.location.pathname) return;
            if (nextUrl.pathname === '/booking-confirmation') return;

            const confirmed = window.confirm(message);
            if (!confirmed) {
                event.preventDefault();
                event.stopPropagation();
            }
        };

        const handlePopState = () => {
            const confirmed = window.confirm(message);
            if (!confirmed) {
                window.history.pushState(null, '', window.location.href);
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        document.addEventListener('click', handleDocumentClick, true);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
            document.removeEventListener('click', handleDocumentClick, true);
        };
    }, [bookingData]);
    useEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        loadBookingData();
    }, []);
    const loadBookingData = async () => {
        try {
            const selectionData = sessionStorage.getItem('seatSelection');
            if (!selectionData) {
                toast.error('No booking data found');
                navigate('/movies');
                return;
            }
            const selection = JSON.parse(selectionData);
            const [movieData, showtimeData] = await Promise.all([
                movieService.getMovieById(selection.movieId),
                showtimeService.getShowtimeById(selection.showtimeId)
            ]);
            setBookingData({
                movie: movieData,
                showtime: showtimeData,
                selection
            });
        }
        catch (error) {
            console.error('Error loading booking data:', error);
            toast.error('Failed to load booking data');
            navigate('/movies');
        }
        finally {
            setLoading(false);
        }
    };
    const onSubmit = async (_data) => {
        if (!bookingData || !user)
            return;
        const selectedSeats =
            bookingData.selection.seats ||
            bookingData.selection.selectedSeats ||
            [];
        const bookingId = bookingData.selection.bookingId;
        if (!bookingId || selectedSeats.length === 0) {
            toast.error('Booking data is incomplete. Please select seats again.');
            navigate('/movies');
            return;
        }
        setLoading(true);
        try {
            const paymentMethods = {
                qris: 'QRIS',
                wallet: 'E-wallet',
                va: 'Virtual Account',
                card: 'Credit Card',
            };
            await transactionService.createTransaction({
                bookingId,
                amount: bookingData.selection.totalAmount,
                paymentMethod: paymentMethods[paymentMethod],
            });
            sessionStorage.removeItem('seatSelection');
            toast.success('Transaksi dummy berhasil dibuat!');
            navigate('/booking-confirmation');
        }
        catch (error) {
            console.error('Error processing booking:', error);
            toast.error('Booking failed. Please try again.');
        }
        finally {
            setLoading(false);
        }
    };
    if (loading || !bookingData) {
        return (<div className="min-h-screen flex items-center justify-center bg-dark-900">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    const { movie, showtime, selection } = bookingData;
    const selectedPaymentOption = paymentOptions.find(
        (option) => option.id === paymentMethod,
    );
    const PaymentIcon = selectedPaymentOption.icon;
    return (<div className="min-h-screen bg-dark-950 text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-dark-950/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button
            onClick={() => {
              const confirmed = window.confirm(
                'Are you sure you want to go back? Your payment selection may be lost.'
              );
              if (confirmed) navigate(-1);
            }}
            className="btn btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4"/>
            <span>Back</span>
          </button>
          <BookingProgress currentStep="payment"/>
          <div></div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <p className="section-eyebrow mb-2">Checkout</p>
          <h1 className="text-3xl font-bold font-display">Complete Payment</h1>
          <p className="mt-2 text-slate-400">Choose a payment method</p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.1fr_0.9fr]">
          {/* Payment Form */}
          <div className="cinema-panel p-6">
            <h2 className="text-2xl font-bold mb-6">Payment Method</h2>
            <div className="mb-6 grid grid-cols-2 gap-3">
              {paymentOptions.map((method) => {
            const Icon = method.icon;
            const active = paymentMethod === method.id;
            return (<button key={method.id} type="button" onClick={() => setPaymentMethod(method.id)} className={`rounded-lg border p-4 text-left transition ${active ? 'border-primary-500 bg-primary-500/15 text-white' : 'border-white/10 bg-dark-950 text-slate-300 hover:border-white/30'}`}>
                    <Icon className="mb-3 h-5 w-5 text-accent-400"/>
                    <span className="font-semibold">{method.label}</span>
                  </button>);
        })}
            </div>
            <div className="space-y-4">
              <div className="rounded-lg border border-dashed border-white/15 bg-dark-950 p-6 text-center">
                <PaymentIcon className="mx-auto mb-4 h-12 w-12 text-accent-400"/>
                <h3 className="font-semibold">Pay with {selectedPaymentOption.label}</h3>
                <p className="mt-2 text-sm text-slate-400">{selectedPaymentOption.instruction}</p>
                <p className="mt-3 text-xs text-slate-500">This is a simulation. No actual payment or payment data will be processed.</p>
              </div>
              <div className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                <ShieldCheck className="h-4 w-4"/>
                This method is only recorded as a payment option for the dummy transaction.
              </div>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="cinema-panel p-6">
            <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <img src={movie.poster_url || movie.poster} alt={movie.title} className="w-20 rounded-lg"/>
                <div>
                  <h3 className="font-semibold text-lg">{movie.title}</h3>
                  <p className="text-sm text-slate-400">{showtime.hall.hall_name}</p>
                </div>
              </div>
              <div className="border-t border-dark-700 pt-4 space-y-2">
                <div className="flex justify-between"><span className="text-slate-400">Date</span><span>{new Date(showtime.show_date).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Time</span><span>{showtime.start_time}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Seats</span><span>{(selection.seats || selection.selectedSeats || []).join(', ')}</span></div>
              </div>
              <div className="border-t border-dark-700 pt-4">
                <div className="flex justify-between font-bold text-xl">
                    <span>Total</span>
                    <span>IDR {selection.totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <button onClick={onSubmit} disabled={loading} className="btn btn-primary w-full text-lg mt-4 py-3">
                {loading ? <LoadingSpinner size="sm"/> : 'Confirm Payment Method'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>);
}
