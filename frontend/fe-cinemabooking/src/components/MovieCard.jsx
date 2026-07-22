import { Link } from "react-router-dom";
import { Calendar, Clock, Info, Play, Star, Ticket } from "lucide-react";
export default function MovieCard({ movie, hasShowtimes = true }) {
  const isComingSoon = movie.status === "coming_soon";
  const canBook = !isComingSoon && hasShowtimes;
  const releaseYear = new Date(movie.release_date).getFullYear();
  const genres = (Array.isArray(movie.genre) ? movie.genre : [movie.genre])
    .filter(Boolean);
  return (
    <div className="movie-card group flex h-full flex-col">
      <div className="relative aspect-[2/3] flex-none overflow-hidden">
        <img
          src={
            movie.poster ||
            movie.poster_url ||
            "https://images.pexels.com/photos/7991579/pexels-photo-7991579.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop"
          }
          alt={movie.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-dark-950 via-dark-950/20 to-transparent opacity-90" />
        <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
          <span
            className={`cinema-badge ${isComingSoon ? "text-accent-200" : "badge-now-playing"}`}
          >
            {isComingSoon ? "Coming Soon" : "Now Playing"}
          </span>
          {movie.classification && (
            <span className="rounded bg-dark-950/80 px-2 py-1 text-xs font-bold text-white">
              {movie.classification}
            </span>
          )}
        </div>
        {!isComingSoon && movie.rating ? (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-dark-950/85 px-3 py-1 text-sm font-semibold text-accent-300">
            <Star className="h-4 w-4 fill-current" />
            {movie.rating.toFixed(1)}
          </div>
        ) : null}
        <div className="absolute inset-x-3 bottom-3 hidden translate-y-3 flex-col gap-2 opacity-0 transition-all duration-300 group-hover:flex group-hover:translate-y-0 group-hover:opacity-100">
          <Link to={`/movies/${movie._id}`} className="btn btn-accent w-full">
            <Info className="h-4 w-4" />
            Details
          </Link>
          <Link
            to={canBook ? `/book/${movie._id}` : `/movies/${movie._id}`}
            className={`btn w-full ${canBook ? "btn-primary" : "btn-secondary"}`}
          >
            {canBook ? (
              <Ticket className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {canBook ? "Buy Ticket" : "Preview"}
          </Link>
        </div>
      </div>
      <div className="flex min-h-[210px] flex-1 flex-col p-4">
        <h3 className="mb-2 line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-7 transition-colors group-hover:text-accent-300">
          {movie.title}
        </h3>
        <div className="mb-3 flex min-h-5 items-center gap-4 text-sm text-slate-400">
          <div className="flex min-w-0 items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className="truncate">{movie.duration} mins</span>
          </div>
          <div className="flex min-w-0 items-center gap-1">
            <Calendar className="h-4 w-4" />
            <span>{releaseYear}</span>
          </div>
        </div>
        <div className="mb-4 flex min-h-[2rem] flex-wrap content-start gap-2">
          {genres.map((genre) => (
            <span
              key={genre}
              className="rounded-full bg-primary-950/80 px-3 py-1 text-xs font-bold text-primary-300 ring-1 ring-primary-500/15"
            >
              {genre}
            </span>
          ))}
          {isComingSoon && (
            <span className="rounded-full bg-accent-500/15 px-3 py-1 text-xs font-semibold text-accent-300">
              {new Date(movie.release_date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          )}
        </div>
        <div className="mt-auto flex min-h-9 items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
          <span className="min-w-0 truncate">
            {canBook ? "Tickets Open" : "No showtime yet"}
          </span>
          <Link
            to={`/movies/${movie._id}`}
            className="shrink-0 text-primary-400 transition hover:text-primary-300"
          >
            Open
          </Link>
        </div>
      </div>
    </div>
  );
}
