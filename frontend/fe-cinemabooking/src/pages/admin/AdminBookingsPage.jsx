import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, CheckCircle, XCircle, Download } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { adminService } from '@/services/adminService';
import { movieService } from '@/services/movieService';
export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState([]);
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [movieFilter, setMovieFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');
    useEffect(() => {
        fetchBookings();
        movieService.getMovies().then(setMovies);
    }, []);
    const fetchBookings = async () => {
        setLoading(true);
        try {
            setBookings(await adminService.getAllBookings());
        }
        catch (error) {
            toast.error('Failed to load bookings');
            console.error('Error fetching bookings:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleUpdateBookingStatus = async (bookingId, status) => {
        try {
            await adminService.updateBookingStatus(bookingId, status);
            toast.success(`Booking ${status} successfully`);
            fetchBookings();
        }
        catch (error) {
            toast.error('Failed to update booking status');
            console.error('Error updating booking status:', error);
        }
    };
    const handleExport = () => {
        const csvRows = [
            ['Booking ID', 'Customer', 'Movie', 'Show Date', 'Start Time', 'Seats', 'Amount', 'Status'],
            ...displayBookings.map(b => [
                b._id,
                b.user.fullName,
                b.showtime.movie.title,
                b.showtime.show_date,
                b.showtime.start_time,
                b.selected_seats.join(', '),
                b.total_amount,
                b.status
            ])
        ];
        const csvContent = csvRows.map(row => row.map(String).map(val => `"${val}"`).join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings_export.csv';
        a.click();
        URL.revokeObjectURL(url);
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
    const displayBookings = bookings.filter((booking) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = !query ||
            booking._id.toLowerCase().includes(query) ||
            booking.user.fullName.toLowerCase().includes(query) ||
            booking.user.email.toLowerCase().includes(query) ||
            booking.showtime.movie.title.toLowerCase().includes(query);
        const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
        const matchesMovie = !movieFilter || booking.showtime.movie._id === movieFilter;
        const matchesDate = !dateFilter || booking.showtime.show_date.startsWith(dateFilter);
        return matchesSearch && matchesStatus && matchesMovie && matchesDate;
    });
    const totalRevenue = bookings
        .filter(booking => booking.status === 'confirmed')
        .reduce((sum, booking) => sum + booking.total_amount, 0);
    if (loading) {
        return (<div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    return (<div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Bookings</h1>
          <p className="text-slate-400">Manage customer bookings</p>
        </div>
        <button onClick={handleExport} className="btn btn-secondary flex items-center space-x-2">
          <Download className="h-4 w-4"/>
          <span>Export</span>
        </button>
      </div>

      <div className="cinema-panel grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
        <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="input" placeholder="Search bookings..."/>
        <select value={movieFilter} onChange={(event) => setMovieFilter(event.target.value)} className="input">
          <option value="">All Movies</option>
          {movies.map((movie) => <option key={movie._id} value={movie._id}>{movie.title}</option>)}
        </select>
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="input">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} className="input"/>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Bookings</p>
          <p className="text-2xl font-bold text-white">{bookings.length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Confirmed</p>
          <p className="text-2xl font-bold text-green-400">{bookings.filter(b => b.status === 'confirmed').length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Pending</p>
          <p className="text-2xl font-bold text-yellow-400">{bookings.filter(b => b.status === 'pending').length}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Total Revenue</p>
          <p className="text-2xl font-bold text-primary-400">IDR {totalRevenue.toLocaleString()}</p>
        </div>
      </div>

      {displayBookings.length === 0 ? (<div className="text-center py-12 card">
          <p className="text-slate-400 text-lg">No bookings found for the selected filters.</p>
        </div>) : (<div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-dark-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Movie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Seats</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700">
                {displayBookings.map((booking) => (<tr key={booking._id} className="hover:bg-dark-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">#{booking._id.slice(-6)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div>{booking.user.fullName}</div>
                      <div className="text-slate-400">{booking.user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img src={booking.showtime?.movie?.poster || booking.showtime?.movie?.poster_url || 'https://placehold.co/60x90/0f172a/94a3b8?text=N/A'} alt={booking.showtime?.movie?.title} className="w-10 h-15 object-cover rounded"/>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-white">{booking.showtime?.movie?.title}</div>
                          <div className="text-sm text-slate-400">{booking.showtime?.hall?.hall_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      <div>{new Date(booking.showtime?.show_date || '').toLocaleDateString()}</div>
                      <div className="text-slate-400">{booking.showtime?.start_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{booking.selected_seats?.join(', ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-400">IDR {booking.total_amount.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getStatusBadge(booking.status)}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Link to={`/admin/bookings/${booking._id}`} className="text-blue-400 hover:text-blue-300">
                          <Eye className="h-4 w-4"/>
                        </Link>
                      </div>
                    </td>
                  </tr>))}
              </tbody>
            </table>
          </div>
        </div>)}
    </div>);
}
