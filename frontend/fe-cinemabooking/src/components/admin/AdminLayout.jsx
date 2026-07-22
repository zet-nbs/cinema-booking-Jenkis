import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Film,
  Building,
  Calendar,
  Users,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  BarChart3,
  MapPin,
  Armchair,
  Receipt,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";
const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Locations", href: "/admin/locations", icon: MapPin },
  { name: "Cinemas", href: "/admin/cinemas", icon: Building },
  { name: "Studios", href: "/admin/studios", icon: Building },
  { name: "Movies", href: "/admin/movies", icon: Film },
  { name: "Showtimes", href: "/admin/showtimes", icon: Calendar },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Bookings", href: "/admin/bookings", icon: Users },
  { name: "Transactions", href: "/admin/transactions", icon: Receipt },
  { name: "Reports", href: "/admin/reports", icon: BarChart3 },
  { name: "Back to Cinema", href: "/", icon: Film },
];
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => localStorage.getItem("cinema-theme") || "dark",
  );
  const { signOut, user } = useAuth();
  const location = useLocation();
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("cinema-theme", theme);
  }, [theme]);
  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Error signing out");
    }
  };
  return (
    <div className="admin-shell min-h-screen bg-dark-950">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? "block" : "hidden"}`}
      >
        <div
          className="fixed inset-0 bg-dark-900/80"
          onClick={() => setSidebarOpen(false)}
        />
        <div className="admin-sidebar fixed inset-y-0 left-0 w-64 bg-dark-900 border-r border-dark-700">
          <div className="flex items-center justify-between p-4">
            <h2 className="text-xl font-display font-bold text-gradient">
              Admin Panel
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href === "/admin/studios" &&
                  location.pathname === "/admin/halls");
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-500/20 text-primary-400 border-r-2 border-primary-500"
                      : "text-slate-300 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="admin-sidebar flex flex-col flex-grow bg-dark-900 border-r border-dark-700">
          <div className="flex items-center h-16 px-4 border-b border-dark-700">
            <h2 className="text-xl font-display font-black uppercase tracking-tight text-primary-500">
              Cinema<span className="text-white">Ops</span>
            </h2>
          </div>
          <nav className="mt-8 flex-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.href ||
                (item.href === "/admin/studios" &&
                  location.pathname === "/admin/halls");
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary-500/20 text-primary-400 border-r-2 border-primary-500"
                      : "text-slate-300 hover:text-white hover:bg-dark-800"
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="p-4 border-t border-dark-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-white">
                  {user?.fullName?.[0] || "A"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {user?.fullName || "Admin"}
                </p>
                <p className="text-xs text-slate-400">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-dark-900/95 backdrop-blur-sm border-b border-dark-700">
          <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center space-x-4">
              <span className="text-slate-300">
                Welcome back, {user?.fullName || "Admin"}
              </span>
              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:bg-white/10"
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                title={theme === "dark" ? "Light mode" : "Dark mode"}
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
