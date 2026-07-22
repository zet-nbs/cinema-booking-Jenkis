import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Users, Ticket, ArrowLeft, Download } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { bookingService } from '@/services/bookingService';
import { transactionService } from '@/services/transactionService';
export default function BookingDetailsPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const [booking, setBooking] = useState(null); // Updated state type
    const [transaction, setTransaction] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (id && user) {
            fetchBookingDetails(id);
        }
    }, [id, user]);
    const fetchBookingDetails = async (bookingId) => {
        try {
            const data = await bookingService.getBookingById(bookingId);
            // Basic check to ensure the logged-in user owns this booking
            if (data.user.id !== user?.id && data.user._id !== user?.id && user?.role !== 'admin') {
                throw new Error("You are not authorized to view this booking.");
            }
            setBooking(data);
            try {
                const transactions = await transactionService.getHistory();
                setTransaction(transactions.find((item) => {
                    const transactionBookingId = typeof item.bookingId === 'string'
                        ? item.bookingId
                        : item.bookingId?._id;
                    return String(transactionBookingId) === String(bookingId);
                }) || null);
            } catch (transactionError) {
                console.error('Error fetching transaction history:', transactionError);
            }
        }
        catch (error) {
            console.error('Error fetching booking details:', error);
        }
        finally {
            setLoading(false);
        }
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
    const formatDateTime = (date) => {
        if (!date) return '-';
        const parsedDate = new Date(date);
        return Number.isNaN(parsedDate.getTime()) ? '-' : parsedDate.toLocaleString('id-ID');
    };
    const getCinemaName = () =>
        booking.showtime?.cinema_name ||
        booking.showtime?.bioskop?.name ||
        booking.showtime?.cinema?.name ||
        '-';
    const getStudioName = () =>
        booking.showtime?.hall?.hall_name ||
        booking.showtime?.studio ||
        '-';
    const handleDownloadPdf = () => {
        const bookingDate = formatDateTime(transaction?.paymentDate);
        const showDate = booking.showtime?.show_date
            ? new Date(booking.showtime.show_date).toLocaleDateString('id-ID', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            : '-';
        const details = [
            `Booking ID: #${booking._id.slice(-6)}`,
            `Customer: ${booking.user?.fullName || '-'}`,
            `Email: ${booking.user?.email || '-'}`,
            `Movie: ${booking.showtime?.movie?.title || '-'}`,
            `Cinema: ${getCinemaName()}`,
            `Studio: ${getStudioName()}`,
            `Show Date: ${showDate}`,
            `Show Time: ${booking.showtime?.start_time || '-'}`,
            `Seats: ${booking.selected_seats?.join(', ') || '-'}`,
            `Number of Tickets: ${booking.total_seats || 0}`,
            `Total Amount: IDR ${(booking.total_amount || 0).toLocaleString('id-ID')}`,
            `Booking Date: ${bookingDate}`,
            `Status: ${booking.status || '-'}`,
        ];
        const escapePdfText = (value) => String(value)
            .replace(/\\/g, '\\\\')
            .replace(/[()]/g, '\\$&')
            .replace(/[^\x20-\x7E]/g, '?');
        const textLines = details.flatMap((line) => {
            const words = line.split(' ');
            return words.reduce((lines, word) => {
                const lastLine = lines[lines.length - 1];
                if (`${lastLine} ${word}`.length > 82) lines.push(word);
                else lines[lines.length - 1] = `${lastLine} ${word}`.trim();
                return lines;
            }, ['']);
        });
        const content = [
            '0.06 0.09 0.16 rg 0 800 595 42 re f',
            '1 1 1 rg BT /F1 22 Tf 42 817 Td (Cinema Booking Details) Tj ET',
            `BT /F1 10 Tf 42 804 Td (Booking #${escapePdfText(booking._id.slice(-6))}) Tj ET`,
            '0.06 0.09 0.16 rg',
            ...textLines.map((line, index) => `BT /F1 11 Tf 42 ${775 - (index * 22)} Td (${escapePdfText(line)}) Tj ET`),
        ].join('\n');
        const objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
            `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
        ];
        let pdf = '%PDF-1.4\n';
        const offsets = [0];
        objects.forEach((object, index) => {
            offsets.push(new TextEncoder().encode(pdf).length);
            pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
        });
        const xrefOffset = new TextEncoder().encode(pdf).length;
        pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
        pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
        pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

        const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `booking-${booking._id.slice(-6)}.pdf`;
        link.click();
        URL.revokeObjectURL(url);
    };
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    if (!booking) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
          <Link to="/my-bookings" className="btn btn-primary">
            Back to Bookings
          </Link>
        </div>
      </div>);
    }
    return (<div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <Link to="/my-bookings" className="btn btn-secondary flex items-center space-x-2">
            <ArrowLeft className="h-4 w-4"/>
            <span>Back</span>
          </Link>
          <h1 className="text-3xl font-display font-bold">Booking Details</h1>
          <button onClick={handleDownloadPdf} className="btn btn-primary flex items-center space-x-2 sm:ml-auto">
            <Download className="h-4 w-4"/>
            <span>Download PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Poster */}
          <div className="lg:col-span-1">
            <img src={booking.showtime?.movie?.poster || booking.showtime?.movie?.poster_url || 'https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop'} alt={booking.showtime?.movie?.title} className="w-full rounded-xl shadow-lg"/>
          </div>

          {/* Booking Information */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold">
                  {booking.showtime?.movie?.title}
                </h2>
                <span className={getStatusBadge(booking.status)}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-slate-400">Customer</p>
                    <p className="font-medium">{booking.user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="font-medium">{booking.user.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <Ticket className="h-6 w-6 text-primary-400"/>
                    <div>
                      <p className="text-sm text-slate-400">Booking ID</p>
                      <p className="font-semibold">#{booking._id.slice(-6)}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-primary-400"/>
                    <div>
                      <p className="text-sm text-slate-400">Cinema</p>
                      <p className="font-semibold">{getCinemaName()}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-primary-400"/>
                    <div>
                      <p className="text-sm text-slate-400">Studio</p>
                      <p className="font-semibold">{getStudioName()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-6 w-6 text-primary-400"/>
                    <div>
                      <p className="text-sm text-slate-400">Show Date</p>
                      <p className="font-semibold">
                        {new Date(booking.showtime?.show_date || '').toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-primary-400"/>
                    <div>
                      <p className="text-sm text-slate-400">Show Time</p>
                      <p className="font-semibold">{booking.showtime?.start_time}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center space-x-3">
                      <Users className="h-6 w-6 text-primary-400"/>
                      <div>
                        <p className="text-sm text-slate-400">Seats</p>
                        <p className="font-semibold">{booking.selected_seats?.join(', ')}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Total Amount</p>
                    <p className="text-2xl font-bold text-primary-400">
                      IDR {booking.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-dark-600">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                    <div>
                      <p className="text-slate-400">Booking Date</p>
                      <p className="font-medium">
                        {formatDateTime(transaction?.paymentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400">Number of Tickets</p>
                      <p className="font-medium">{booking.total_seats}</p>
                    </div>
                  </div>
                </div>

                {booking.status === 'confirmed' && (<div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <p className="text-green-400 font-medium">
                      🎉 Your booking is confirmed! Please arrive at the cinema at least 15 minutes before the show time.
                    </p>
                  </div>)}

                {booking.status === 'cancelled' && (<div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                    <p className="text-red-400 font-medium">
                      ❌ This booking has been cancelled.
                    </p>
                  </div>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
