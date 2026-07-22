import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Home, LogIn, LogOut, Menu, Moon, Search, Settings, Sun, Ticket, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';
export default function Header({ sidebarCollapsed = false, onToggleSidebar }) {
    const { user, isAdmin, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [theme, setTheme] = useState(() => localStorage.getItem('cinema-theme') || 'dark');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
        localStorage.setItem('cinema-theme', theme);
    }, [theme]);
    useEffect(() => {
        if (searchOpen) {
            searchInputRef.current?.focus();
        }
    }, [searchOpen]);
    const handleSignOut = async () => {
        try {
            await signOut();
            toast.success('Signed out successfully');
            navigate('/');
        }
        catch (error) {
            toast.error('Error signing out');
        }
    };
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const query = searchTerm.trim();
        if (!searchOpen) {
            setSearchOpen(true);
            return;
        }
        if (query) {
            navigate(`/movies?search=${encodeURIComponent(query)}`);
        }
    };
    const navItems = [
        { href: '/', label: 'Home', icon: Home },
        { href: '/movies', label: 'Movies', icon: Film },
        { href: '/my-bookings', label: 'My Tickets', icon: Ticket },
    ];
    const isActivePath = (href) => href === '/' ? location.pathname === '/' : location.pathname.startsWith(href);
    const NavLink = ({ item, compact = false }) => {
        const Icon = item.icon;
        const active = isActivePath(item.href);
        return (<Link to={item.href} title={item.label} className={clsx(compact
                ? 'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition'
                : sidebarCollapsed
                  ? 'flex items-center justify-center rounded-md px-0 py-3 text-base font-bold transition'
                  : 'flex items-center gap-4 rounded-md px-4 py-3 text-base font-bold transition', active
                ? 'bg-white/10 text-white'
                : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
          <Icon className={compact ? 'h-4 w-4' : 'h-6 w-6'}/>
          <span className={clsx(sidebarCollapsed && !compact ? 'sr-only' : '')}>{item.label}</span>
        </Link>);
    };
    return (<>
      <aside className={clsx('public-sidebar fixed left-0 top-0 z-50 hidden h-screen border-r border-white/10 bg-dark-950 px-4 py-5 transition-all duration-300 md:block', sidebarCollapsed ? 'w-20' : 'w-64')}>
        <div className={clsx('mb-7 flex items-center px-1', sidebarCollapsed ? 'justify-center' : 'gap-3')}>
          <button onClick={onToggleSidebar} className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-200 hover:bg-white/10" type="button" aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Menu className="h-6 w-6"/>
          </button>
          <Link to="/" className={clsx('items-center gap-2', sidebarCollapsed ? 'hidden' : 'flex')}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500 shadow-lg shadow-primary-950/40">
              <Film className="h-5 w-5 text-white"/>
            </span>
            <span className="text-xl font-display font-black tracking-tight text-white">
              Cinema<span className="text-primary-500">Flix</span>
            </span>
          </Link>
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => <NavLink key={item.href} item={item}/>)}
        </nav>
        <div className="absolute bottom-5 left-4 right-4 space-y-2 border-t border-white/10 pt-4">
          {isAdmin && (<Link to="/admin" title="Admin Panel" className={clsx('flex rounded-md py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white', sidebarCollapsed ? 'items-center justify-center px-0' : 'items-center gap-3 px-4')}>
            <Settings className="h-5 w-5"/>
            <span className={sidebarCollapsed ? 'sr-only' : ''}>Admin Panel</span>
          </Link>)}
          <button
            type="button"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={clsx('flex w-full rounded-md py-3 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white', sidebarCollapsed ? 'items-center justify-center px-0' : 'items-center gap-3 px-4')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5"/> : <Moon className="h-5 w-5"/>}
            <span className={sidebarCollapsed ? 'sr-only' : ''}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          {user && <div className={clsx('flex items-center py-2 text-sm text-slate-400', sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-4')}>
            <User className="h-5 w-5 text-primary-500"/>
            <span className={clsx('truncate', sidebarCollapsed ? 'sr-only' : '')}>{user.fullName || user.email}</span>
          </div>}
        </div>
      </aside>
      <header className={clsx('sticky top-0 z-40 border-b border-white/10 bg-dark-950/85 backdrop-blur-xl transition-all duration-300', sidebarCollapsed ? 'md:ml-20' : 'md:ml-64')}>
        <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 md:hidden">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500">
              <Film className="h-5 w-5 text-white"/>
            </span>
            <span className="text-lg font-black text-white">Cinema<span className="text-primary-500">Flix</span></span>
          </Link>
          <nav className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto">
            <form onSubmit={handleSearchSubmit} className={clsx('flex shrink-0 items-center overflow-hidden rounded-full border transition-all duration-300', searchOpen ? 'w-44 border-white/30 bg-black/70 pl-3 pr-1 sm:w-64' : 'w-10 border-transparent bg-transparent px-0 hover:bg-white/10')}>
              <button type="submit" className="flex h-10 w-10 shrink-0 items-center justify-center text-slate-100" aria-label={searchOpen ? 'Search movies' : 'Open search'}>
                <Search className="h-4 w-4"/>
              </button>
              <input ref={searchInputRef} value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Titles, genres..." className={clsx('min-w-0 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 transition-opacity', searchOpen ? 'w-full opacity-100' : 'w-0 opacity-0')} />
              {searchOpen && (
                <button type="button" onClick={() => {
                    setSearchTerm('');
                    setSearchOpen(false);
                }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 hover:bg-white/10" aria-label="Close search">
                  <X className="h-4 w-4"/>
                </button>
              )}
            </form>
            {navItems.map((item) => <NavLink key={item.href} item={item} compact/>)}
            {user ? (<button onClick={handleSignOut} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/20">
              <LogOut className="h-4 w-4"/>
              Sign Out
            </button>) : (<Link to="/login" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/20">
              <LogIn className="h-4 w-4"/>
              Sign In
            </Link>)}
          </nav>
        </div>
      </header>
    </>);
}
