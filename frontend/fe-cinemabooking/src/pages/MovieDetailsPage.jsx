import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Clock, MapPin, Play, Star, Ticket } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { movieService } from '@/services/movieService';
import { showtimeService } from '@/services/showtimeService';
import { bioskopService } from '@/services/bioskopService';
import { locationService } from '@/services/locationService';
const getYouTubeEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('/embed/')) return url;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11)
        ? `https://www.youtube.com/embed/${match[2]}`
        : url;
};

export default function MovieDetailsPage() {
    const { id } = useParams();
    const [movie, setMovie] = useState(null);
    const [showtimes, setShowtimes] = useState([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedShowtime, setSelectedShowtime] = useState(null);
    const [locations, setLocations] = useState([]);
    const [bioskops, setBioskops] = useState([]);
    const [selectedLocation, setSelectedLocation] = useState('');
    const [selectedBioskop, setSelectedBioskop] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        if (id) {
            fetchMovie(id);
        }
    }, [id]);
    useEffect(() => {
        const loadFilters = async () => {
            try {
                const [locationsData, bioskopsData] = await Promise.all([
                    locationService.getLocations(),
                    bioskopService.getBioskops(),
                ]);
                setLocations(locationsData.data || locationsData || []);
                setBioskops(bioskopsData.data || bioskopsData || []);
            } catch (error) {
                console.error('Error loading cinema filters:', error);
            }
        };
        loadFilters();
    }, []);
    const fetchMovie = async (movieId) => {
        try {
            const [movieData, showtimeData] = await Promise.all([
                movieService.getMovieById(movieId),
                showtimeService.getMovieShowtimes(movieId),
            ]);
            const bookableShowtimes = movieData.status === 'now_showing' ? showtimeData : [];
            setMovie(movieData);
            setShowtimes(bookableShowtimes);
            setSelectedShowtime(null);
            if (bookableShowtimes.length > 0) {
                setSelectedDate(bookableShowtimes[0].show_date.split('T')[0]);
            }
            else {
                setSelectedDate('');
            }
        }
        catch (error) {
            console.error('Error fetching movie:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const getId = (value) => typeof value === 'object' && value !== null ? value._id : value;
    // Derive which bioskops actually have showtimes for this movie
    const availableBioskopIds = useMemo(() => new Set(showtimes.map((s) => getId(s.bioskopId))), [showtimes]);
    const availableBioskops = useMemo(() => bioskops.filter((b) => availableBioskopIds.has(b._id)), [bioskops, availableBioskopIds]);
    // Derive which locations have at least one available bioskop
    const availableLocationIds = useMemo(() => new Set(availableBioskops.map((b) => getId(b.locationId))), [availableBioskops]);
    const availableLocations = useMemo(() => locations.filter((l) => availableLocationIds.has(l._id)), [locations, availableLocationIds]);
    const filteredBioskops = useMemo(() => availableBioskops.filter((bioskop) =>
        !selectedLocation || getId(bioskop.locationId) === selectedLocation,
    ), [availableBioskops, selectedLocation]);
    const showtimesForCinema = useMemo(() => showtimes.filter((showtime) => {
        const bioskopId = getId(showtime.bioskopId);
        if (selectedBioskop && bioskopId !== selectedBioskop) return false;
        if (!selectedLocation) return true;
        const bioskop = bioskops.find((item) => item._id === bioskopId);
        return getId(bioskop?.locationId || showtime.bioskopId?.locationId) === selectedLocation;
    }), [showtimes, bioskops, selectedLocation, selectedBioskop]);
    const allDates = useMemo(() => [...new Set(
        showtimes.map((showtime) => showtime.show_date.split('T')[0]),
    )].sort(), [showtimes]);
    const availableDates = useMemo(() => new Set(
        showtimesForCinema.map((showtime) => showtime.show_date.split('T')[0]),
    ), [showtimesForCinema]);
    const visibleShowtimes = showtimesForCinema.filter((showtime) => showtime.show_date.startsWith(selectedDate));
    useEffect(() => {
        if (!availableDates.has(selectedDate)) {
            const firstAvailable = allDates.find((d) => availableDates.has(d)) || '';
            setSelectedDate(firstAvailable);
            setSelectedShowtime(null);
        }
    }, [availableDates, allDates, selectedDate]);
    if (loading) {
        return (<div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg"/>
      </div>);
    }
    if (!movie) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <Link to="/movies" className="btn btn-primary">
            Back to Movies
          </Link>
        </div>
      </div>);
    }
    const backdrop = movie.backgroundImage || movie.backdrop_url || movie.poster || movie.poster_url;
    const canBook = movie.status === 'now_showing' && showtimes.length > 0;
    const trailerRawUrl = movie.trailer || movie.trailer_url;
    const trailerEmbedUrl = getYouTubeEmbedUrl(trailerRawUrl);
    return (<div className="min-h-screen">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${backdrop})` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/85 to-dark-950/40"/>
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-dark-950 to-transparent"/>
        </div>
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[300px_1fr] lg:px-8 lg:py-16">
          {/* Movie Poster */}
          <div>
            <div className="max-w-[260px]">
              <img src={movie.poster || movie.poster_url || ''} alt={movie.title} className="w-full rounded-lg shadow-2xl shadow-black/60"/>
            </div>
          </div>

          {/* Movie Details */}
          <div className="flex items-center">
            <div className="max-w-3xl space-y-6">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="cinema-badge bg-primary-600/90">{movie.status === 'coming_soon' ? 'Coming Soon' : 'Now Playing'}</span>
                  {movie.classification && <span className="cinema-badge">{movie.classification}</span>}
                  {movie.rating ? (<div className="flex items-center space-x-1 text-accent-400">
                      <Star className="h-5 w-5 fill-current"/>
                      <span className="font-semibold">{movie.rating.toFixed(1)}</span>
                    </div>) : null}
                </div>
                <h1 className="text-4xl font-display font-black mb-4 md:text-6xl">
                  {movie.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-6 text-slate-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5"/>
                    <span>{new Date(movie.release_date).getFullYear()}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5"/>
                    <span>{movie.duration} minutes</span>
                  </div>
                  <div className="px-3 py-1 bg-primary-500/20 text-primary-400 rounded-full text-sm font-medium">
                    {Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {canBook ? (<Link to={selectedShowtime ? `/booking/${selectedShowtime._id}` : `/book/${movie._id}`} className="btn btn-primary text-lg px-8 py-3">
                    <Ticket className="h-5 w-5"/>
                    Buy Tickets
                  </Link>) : (<button type="button" className="btn btn-secondary text-lg px-8 py-3" disabled>
                    <Ticket className="h-5 w-5"/>
                    No showtime yet
                  </button>)}
                {trailerRawUrl && (<a href="#trailer" className="btn btn-secondary text-lg px-8 py-3">
                    <Play className="h-5 w-5"/>
                    Watch Trailer
                  </a>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              <div>
                <p className="section-eyebrow mb-3">Story</p>
                <h2 className="text-2xl font-semibold mb-4">Synopsis</h2>
                <p className="text-slate-300 leading-relaxed text-lg">
                  {movie.description}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">Director</h2>
                  <p className="text-slate-300">{movie.director || 'To be announced'}</p>
                </div>
                <div>
                  <h2 className="text-xl font-semibold mb-2">Cast</h2>
                  <p className="text-slate-300">

                    {movie.cast && movie.cast.length > 0
                    ? movie.cast.join(', ')
                    : 'To be announced'}
                  </p>
                </div>
              </div>

              {/* Trailer */}
              {trailerRawUrl && (<div id="trailer">
                  <p className="section-eyebrow mb-3">Preview</p>
                  <h2 className="text-2xl font-semibold mb-4">Trailer</h2>
                  <div className="aspect-video rounded-xl overflow-hidden bg-dark-800">
                    <iframe src={trailerEmbedUrl} title={`${movie.title} Trailer`} className="w-full h-full" allowFullScreen/>
                  </div>
                </div>)}

          </div>

          <aside className="lg:col-span-1">
              {showtimes.length > 0 ? (<div className="cinema-panel sticky top-24 p-6">
                  <p className="section-eyebrow mb-3">Book now</p>
                  <h2 className="text-2xl font-semibold mb-4">Select Showtime</h2>
                  <div className="mb-5 grid gap-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-400">Location</label>
                      <select value={selectedLocation} onChange={(event) => {
                    setSelectedLocation(event.target.value);
                    setSelectedBioskop('');
                    setSelectedShowtime(null);
                }} className="input">
                        <option value="">All Locations</option>
                        {availableLocations.map((location) => (<option key={location._id} value={location._id}>
                            {location.city || location.name}
                          </option>))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-400">Bioskop</label>
                      <select value={selectedBioskop} onChange={(event) => {
                    setSelectedBioskop(event.target.value);
                    setSelectedShowtime(null);
                }} className="input">
                        <option value="">All Cinemas</option>
                        {filteredBioskops.map((bioskop) => (<option key={bioskop._id} value={bioskop._id}>
                            {bioskop.name}
                          </option>))}
                      </select>
                    </div>
                  </div>
                  <div className="mb-3 flex items-center gap-2 text-sm text-slate-400"><MapPin className="h-4 w-4 text-accent-400"/>Select a location, cinema, and showtime.</div>
                  {selectedLocation && selectedBioskop ? (
                    <>
                      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
                        {allDates.map((date) => {
                          const isAvailable = availableDates.has(date);
                          return (<button key={date} disabled={!isAvailable} onClick={() => {
                            setSelectedDate(date);
                            setSelectedShowtime(null);
                          }} className={`min-w-24 rounded-md px-4 py-3 text-left transition ${!isAvailable ? 'opacity-40 cursor-not-allowed bg-dark-950 text-slate-500' : selectedDate === date ? 'bg-primary-600 text-white' : 'bg-dark-950 text-slate-300 hover:bg-dark-800'}`}>
                            <span className="block text-xs uppercase opacity-70">
                              {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                            </span>
                            <span className="block font-bold">
                              {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          </button>);
                        })}
                      </div>
                      <div className="space-y-3">
                        {visibleShowtimes.length > 0 ? visibleShowtimes.map((showtime) => (<button key={showtime._id} onClick={() => setSelectedShowtime(showtime)} className={`w-full rounded-lg border p-4 text-left transition hover:border-primary-500 ${selectedShowtime?._id === showtime._id ? 'border-primary-500 bg-primary-500/10' : ''}`}>
                            <div className="flex items-center justify-between">
                              <p className="text-lg font-bold">{showtime.start_time}</p>
                              <p className="text-accent-400 font-semibold">IDR {showtime.ticket_price.toLocaleString()}</p>
                            </div>
                            <p className="text-sm text-slate-400">{showtime.hall.hall_name} • {showtime.end_time} finish</p>
                          </button>)) : <p className="rounded-lg border border-dashed border-white/15 p-4 text-sm text-slate-400">Tidak ada jadwal untuk filter yang dipilih.</p>}
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg border border-white/5 bg-white/5 p-6 text-center text-slate-400">
                      <MapPin className="h-10 w-10 mx-auto mb-3 opacity-20 text-accent-400" />
                      <p className="text-white text-sm font-semibold">Select your Location & Cinema</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Select a location and cinema above to view available showtimes.
                      </p>
                    </div>
                  )}
                  <Link to={selectedShowtime ? `/booking/${selectedShowtime._id}` : `/book/${movie._id}`} className="btn btn-primary mt-5 w-full py-3 text-base">
                    <Ticket className="h-5 w-5"/>
                    Continue to Seats
                  </Link>
                </div>) : (<div className="cinema-panel p-6">
                  <h2 className="text-xl font-semibold">No showtimes yet</h2>
                  <p className="mt-2 text-slate-400">Check back soon for available sessions.</p>
                </div>)}
          </aside>
        </div>
      </div>
    </div>);
}
