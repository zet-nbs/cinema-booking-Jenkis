import { useEffect, useState } from 'react';
import { Film, Building, TrendingUp, RefreshCcw, Download, DollarSign } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { adminService } from '@/services/adminService';

export default function AdminReportsPage() {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const data = await adminService.getReport();
            setReport(data);
        } catch (error) {
            console.error(error);
            toast.error('Error loading report data');
        } finally {
            setLoading(false);
        }
    };

    const exportCSV = () => {
        if (!report) return;
        const rows = [
            ['Movie', 'User', 'Seats', 'Total (IDR)', 'Date'],
            ...(report.confirmedBookings || []).map((b) => [
                b.movieId?.title || '-',
                b.userId?.name || '-',
                (b.seats || []).length,
                b.totalPrice || 0,
                new Date(b.createdAt).toLocaleDateString(),
            ]),
        ];
        const csv = rows.map((r) => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cinema-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Report exported!');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    const statCards = [
        {
            title: "Today's Revenue",
            value: `IDR ${(report?.todayRevenue || 0).toLocaleString()}`,
            icon: TrendingUp,
            color: 'text-primary-400',
            bgColor: 'bg-primary-500/20',
        },
        {
            title: 'Now Showing Movies',
            value: report?.nowShowingMovies ?? 0,
            icon: Film,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/20',
        },
        {
            title: 'Active Showtimes',
            value: report?.activeHalls ?? 0,
            icon: Building,
            color: 'text-green-400',
            bgColor: 'bg-green-500/20',
        },
        {
            title: 'Weekly Revenue',
            value: `IDR ${(report?.weeklyRevenue || []).reduce((s, d) => s + d.revenue, 0).toLocaleString()}`,
            icon: DollarSign,
            color: 'text-accent-400',
            bgColor: 'bg-accent-500/20',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-display font-bold">Reports</h1>
                    <p className="text-slate-400">Daily performance overview</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportCSV}
                        className="btn btn-secondary flex items-center space-x-2"
                    >
                        <Download className="h-4 w-4" />
                        <span>Export CSV</span>
                    </button>
                    <button
                        onClick={fetchReport}
                        className="btn btn-secondary flex items-center space-x-2"
                    >
                        <RefreshCcw className="h-4 w-4" />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {statCards.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                        <div key={index} className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                                    <p className="text-2xl font-bold text-white">
                                        {typeof stat.value === 'number'
                                            ? stat.value.toLocaleString()
                                            : stat.value}
                                    </p>
                                </div>
                                <div
                                    className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                                >
                                    <Icon className={`h-6 w-6 ${stat.color}`} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Weekly Revenue Chart */}
            <div className="card p-6">
                <h2 className="text-xl font-bold mb-4">Weekly Revenue</h2>
                {(report?.weeklyRevenue || []).every((d) => d.revenue === 0) ? (
                    <div className="flex items-center justify-center h-48 text-slate-400">
                        No revenue data for the past 7 days.
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={report?.weeklyRevenue || []}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#cbd5e1" />
                            <YAxis
                                stroke="#cbd5e1"
                                tickFormatter={(v) =>
                                    v >= 1000000
                                        ? `${(v / 1000000).toFixed(1)}M`
                                        : v >= 1000
                                        ? `${(v / 1000).toFixed(0)}K`
                                        : v
                                }
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    borderColor: '#334155',
                                    color: '#f8fafc',
                                }}
                                formatter={(v) => [`IDR ${v.toLocaleString()}`, 'Revenue']}
                            />
                            <Bar dataKey="revenue" fill="#D70654" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Confirmed Bookings Table */}
            <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Confirmed Bookings</h2>
                    <span className="text-sm text-slate-400">
                        {(report?.confirmedBookings || []).length} records
                    </span>
                </div>
                {(report?.confirmedBookings || []).length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400">
                        No confirmed bookings yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">Movie</th>
                                    <th className="text-left py-3 px-4 text-slate-400 font-semibold">User</th>
                                    <th className="text-center py-3 px-4 text-slate-400 font-semibold">Seats</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-semibold">Total</th>
                                    <th className="text-right py-3 px-4 text-slate-400 font-semibold">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(report.confirmedBookings || []).map((b) => (
                                    <tr
                                        key={b._id}
                                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                                    >
                                        <td className="py-3 px-4 font-medium">
                                            {b.movieId?.title || '—'}
                                        </td>
                                        <td className="py-3 px-4 text-slate-400">
                                            {b.userId?.name || '—'}
                                            {b.userId?.email && (
                                                <div className="text-xs text-slate-500">
                                                    {b.userId.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4 text-center text-slate-300">
                                            {(b.seats || []).length}
                                        </td>
                                        <td className="py-3 px-4 text-right font-semibold text-primary-400">
                                            IDR {(b.totalPrice || 0).toLocaleString()}
                                        </td>
                                        <td className="py-3 px-4 text-right text-slate-400">
                                            {new Date(b.createdAt).toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
