import { Calendar, Mail, Shield, Ticket, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { bookingService } from '@/services/bookingService';
import LoadingSpinner from '@/components/LoadingSpinner';
export default function ProfilePage() {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadBookings = async () => {
            if (!user)
                return;
            try {
                setBookings(await bookingService.getMyBookings(user.id));
            }
            finally {
                setLoading(false);
            }
        };
        loadBookings();
    }, [user]);
    if (!user || loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    const confirmedBookings = bookings.filter((booking) => booking.status === 'confirmed').length;
    return (<div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-display font-bold mb-8">Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card p-6 lg:col-span-1 text-center">
            <div className="w-24 h-24 rounded-full bg-primary-500/20 mx-auto mb-4 flex items-center justify-center overflow-hidden">
              {user.avatarUrl ? (<img src={user.avatarUrl} alt={user.fullName} className="w-full h-full object-cover"/>) : (<User className="h-12 w-12 text-primary-400"/>)}
            </div>
            <h2 className="text-xl font-semibold">{user.fullName}</h2>
            <p className="text-slate-400">{user.email}</p>
            <span className="status-badge status-confirmed mt-4">{user.role}</span>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Account Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-primary-400"/>
                  <div>
                    <p className="text-sm text-slate-400">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-primary-400"/>
                  <div>
                    <p className="text-sm text-slate-400">Role</p>
                    <p className="font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-slate-400">Total Bookings</p>
                  <p className="text-2xl font-bold">{bookings.length}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Confirmed</p>
                  <p className="text-2xl font-bold text-green-400">{confirmedBookings}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Cancelled</p>
                  <p className="text-2xl font-bold text-red-400">
                    {bookings.filter((booking) => booking.status === 'cancelled').length}
                  </p>
                </div>
              </div>
              <Link to="/my-bookings" className="btn btn-primary mt-6 flex items-center space-x-2 w-fit">
                <Ticket className="h-4 w-4"/>
                <span>View My Bookings</span>
              </Link>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-3 text-slate-300">
                <Calendar className="h-5 w-5 text-primary-400"/>
                <p>This profile uses frontend-only demo state for the starter.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
