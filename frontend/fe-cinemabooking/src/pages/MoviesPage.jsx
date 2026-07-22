import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import MovieCard from '@/components/MovieCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
export default function MoviesPage() {
    const [movies, setMovies] = useState([]);
    const [filteredMovies, setFilteredMovies] = useState([]);
    const [showtimeMovieIds, setShowtimeMovieIds] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('now_showing');
    const [sortBy, setSortBy] = useState('title');
    const [genres, setGenres] = useState([]);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchParams] = useSearchParams();
    useEffect(() => {
        fetchMovies();
    }, []);
    useEffect(() => {
        filterMovies();
    }, [movies, searchTerm, selectedGenre, selectedStatus, sortBy]);
    useEffect(() => {
        const query = searchParams.get('search') || '';
        setSearchTerm(query);
        if (query) {
            setSelectedStatus('all');
        }
    }, [searchParams]);
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedGenre, selectedStatus, sortBy]);
    const fetchMovies = async () => {
        try {
            const [data, showtimes] = await Promise.all([
                movieService.getMovies(),
                showtimeService.getShowtimes(),
            ]);
            setMovies(data || []);
            setShowtimeMovieIds(new Set((showtimes || []).map((showtime) => showtime.movie?._id).filter(Boolean)));
            const uniqueGenres = [...new Set(
                (data || []).flatMap((movie) =>
                    Array.isArray(movie.genre) ? movie.genre : [movie.genre],
                ).filter(Boolean),
            )];
            setGenres(uniqueGenres);
        }
        catch (error) {
            console.error('Error fetching movies:', error);
            setError('Could not load demo movies.');
        }
        finally {
            setLoading(false);
        }
    };
    const filterMovies = () => {
        let filtered = movies;
        if (searchTerm) {
            filtered = filtered.filter(movie => movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                movie.description.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (selectedGenre) {
            filtered = filtered.filter(movie =>
                Array.isArray(movie.genre)
                    ? movie.genre.includes(selectedGenre)
                    : movie.genre === selectedGenre,
            );
        }
        if (selectedStatus !== 'all') {
            filtered = filtered.filter(movie => movie.status === selectedStatus);
        }
        filtered = [...filtered].sort((a, b) => {
            if (sortBy === 'release_date') {
                return new Date(b.release_date).getTime() - new Date(a.release_date).getTime();
            }
            if (sortBy === 'rating') {
                return (b.rating || 0) - (a.rating || 0);
            }
            return a.title.localeCompare(b.title);
        });
        setFilteredMovies(filtered);
    };
    const nowShowing = filteredMovies.filter((movie) => movie.status === 'now_showing');
    const comingSoon = filteredMovies.filter((movie) => movie.status === 'coming_soon');
    const pageSize = 8;
    const totalPages = Math.max(1, Math.ceil(nowShowing.length / pageSize));
    const activePage = Math.min(currentPage, totalPages);
    const visibleNowShowing = nowShowing.slice((activePage - 1) * pageSize, activePage * pageSize);
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    return (<div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <p className="section-eyebrow mb-3">Browse Movie</p>
          <h1 className="text-4xl font-display font-bold text-white mb-4">
            Movie and Showtime
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl">
            Browse all currently playing movies in the catalog, then view details or choose your tickets.
          </p>
        </div>

        {/* Filters */}
        <div className="cinema-panel mb-8 grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5"/>
            <input type="text" placeholder="Search movies..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input pl-10"/>
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5"/>
            <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)} className="input pl-10 pr-8 appearance-none bg-dark-800">
              <option value="">All Genres</option>
              {genres.map((genre) => (<option key={genre} value={genre}>
                  {genre}
                </option>))}
            </select>
          </div>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="input bg-dark-800">
            <option value="all">All Status</option>
            <option value="now_showing">Now Showing</option>
            <option value="coming_soon">Coming Soon</option>
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="input bg-dark-800">
            <option value="title">Sort by Title</option>
            <option value="release_date">Sort by Release Date</option>
            <option value="rating">Sort by Rating</option>
          </select>
        </div>

        {error && <div className="card p-4 mb-8 text-red-300 border-red-500/40">{error}</div>}

        {/* Movie Catalog */}
        {filteredMovies.length > 0 ? (<>
            <div className="mb-5 flex items-center justify-between text-sm text-slate-400">
              <span>{filteredMovies.length} movies found</span>
              <span>{selectedStatus === 'all' ? 'All titles' : selectedStatus === 'now_showing' ? 'Now playing' : 'Coming soon'}</span>
            </div>
            {(selectedStatus === 'all' || selectedStatus === 'now_showing') && nowShowing.length > 0 && (
              <MovieGrid
                title="Movies in Theaters"
                eyebrow="Current Release"
                movies={visibleNowShowing}
                showtimeMovieIds={showtimeMovieIds}
                currentPage={activePage}
                totalPages={totalPages}
                totalMovies={nowShowing.length}
                onPageChange={setCurrentPage}
              />
            )}
            {(selectedStatus === 'all' || selectedStatus === 'coming_soon') && comingSoon.length > 0 && (
              <MovieGrid
                title="Upcoming in Theaters"
                eyebrow="Releasing Soon"
                movies={comingSoon}
                showtimeMovieIds={showtimeMovieIds}
                currentPage={1}
                totalPages={1}
                totalMovies={comingSoon.length}
                onPageChange={() => {}}
              />
            )}
          </>) : (<div className="text-center py-12">
            <p className="text-slate-400 text-lg">
              {searchTerm || selectedGenre
                ? 'No movies found matching your criteria.'
                : 'No movies currently available.'}
            </p>
          </div>)}
      </div>
    </div>);
}

function MovieGrid({ eyebrow, title, movies, showtimeMovieIds, currentPage, totalPages, totalMovies, onPageChange }) {
    return (
      <section className="mb-12">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="section-eyebrow mb-2">{eyebrow}</p>
            <h2 className="text-2xl font-black text-white md:text-3xl">{title}</h2>
          </div>
          <p className="text-sm text-slate-400">{totalMovies} film</p>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4">
          {movies.map((movie) => <MovieCard key={movie._id} movie={movie} hasShowtimes={movie.status === 'now_showing' && (showtimeMovieIds.has(movie._id) || movie.release === true)}/>)}
        </div>
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button type="button" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} className="btn btn-secondary h-10 w-10 px-0 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="h-5 w-5"/>
            </button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button key={page} type="button" onClick={() => onPageChange(page)} className={`h-10 w-10 rounded-full text-sm font-bold transition ${page === currentPage ? 'bg-primary-500 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`} aria-label={`Page ${page}`}>
                {page}
              </button>
            ))}
            <button type="button" onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} className="btn btn-secondary h-10 w-10 px-0 disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="h-5 w-5"/>
            </button>
          </div>
        )}
      </section>
    );
}
