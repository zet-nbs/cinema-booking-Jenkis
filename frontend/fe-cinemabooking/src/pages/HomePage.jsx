import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, Play, Star, Ticket } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MovieCard from "@/components/MovieCard";
import LoadingSpinner from "@/components/LoadingSpinner";
import { movieService } from "@/services/movieService";
import { showtimeService } from "@/services/showtimeService";

gsap.registerPlugin(ScrollTrigger);

const getShowtimeMovieId = (showtime) => {
  const movie = showtime.movie || showtime.movieId;
  if (!movie) return null;
  if (typeof movie === "string") return movie;
  return movie._id || movie.$oid || null;
};

export default function HomePage() {
  const [movies, setMovies] = useState([]);
  const [showtimeMovieIds, setShowtimeMovieIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [error, setError] = useState("");
  const heroTrackRef = useRef(null);
  const heroPosterRef = useRef(null);
  const heroCopyRef = useRef(null);

  useEffect(() => {
    fetchMovies();
  }, []);

  const fetchMovies = async () => {
    try {
      const [data, showtimes] = await Promise.all([
        movieService.getMovies(),
        showtimeService.getShowtimes({ limit: 5000 }),
      ]);
      setMovies(data || []);
      setShowtimeMovieIds(
        new Set(
          (showtimes || [])
            .map(getShowtimeMovieId)
            .filter(Boolean),
        ),
      );
      if (data && data.length > 0) {
        setFeaturedMovie(0);
      }
    } catch (error) {
      console.error("Error fetching movies:", error);
      setError("Could not load demo movies.");
    } finally {
      setLoading(false);
    }
  };

  const nowShowing = movies.filter((movie) => movie.status === "now_showing");
  const comingSoon = movies.filter((movie) => movie.status === "coming_soon");
  const heroSlides = nowShowing.slice(0, 3);
  const heroMovie = heroSlides[featuredMovie] || heroSlides[0] || movies[0];

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const timer = window.setInterval(() => {
      setFeaturedMovie((current) =>
        typeof current === "number" ? (current + 1) % heroSlides.length : 1,
      );
    }, 3000);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  useEffect(() => {
    if (!heroSlides.length || typeof featuredMovie !== "number") return;
    gsap.to(heroTrackRef.current, {
      xPercent: -100 * featuredMovie,
      duration: 0.9,
      ease: "power3.inOut",
    });
    gsap.fromTo(
      heroCopyRef.current,
      { autoAlpha: 0, x: 38 },
      { autoAlpha: 1, x: 0, duration: 0.7, ease: "power3.out", delay: 0.15 },
    );
    gsap.fromTo(
      heroPosterRef.current,
      { autoAlpha: 0, x: 70, rotate: 2 },
      {
        autoAlpha: 1,
        x: 0,
        rotate: 0,
        duration: 0.75,
        ease: "power3.out",
        delay: 0.18,
      },
    );
  }, [featuredMovie, heroSlides.length]);

  useEffect(() => {
    const cards = document.querySelectorAll(".movie-reveal-card");
    if (cards.length === 0) return undefined;
    const ctx = gsap.context(() => {
      gsap.set(cards, { autoAlpha: 0, y: 42, scale: 0.96 });
      ScrollTrigger.batch(cards, {
        start: "top 88%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.08,
          }),
      });
    });
    return () => ctx.revert();
  }, [movies.length]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      {heroMovie && (
        <section className="cinema-hero relative min-h-[82vh] overflow-hidden">
          <div
            ref={heroTrackRef}
            className="absolute inset-0 flex will-change-transform"
          >
            {heroSlides.map((movie) => (
              <div
                key={movie._id}
                className="relative h-full w-full flex-none bg-cover bg-center"
                style={{
                  backgroundImage: `url(${movie.backgroundImage || movie.backdrop_url || movie.poster || movie.poster_url})`,
                }}
              />
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-dark-950 via-dark-950/80 to-dark-950/15" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_35%,transparent_0,rgba(0,0,0,.25)_30%,rgba(0,0,0,.75)_74%)]" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-dark-950 to-transparent" />

          <div className="relative z-10 grid min-h-[82vh] max-w-7xl items-center gap-10 px-4 pb-32 pt-16 sm:px-6 lg:mx-auto lg:grid-cols-[minmax(0,1fr)_330px] lg:px-8">
            <div ref={heroCopyRef} className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-3">
                <span className="cinema-badge bg-primary-500/95">
                  Now Playing
                </span>
                {heroMovie.classification && (
                  <span className="cinema-badge">
                    {heroMovie.classification}
                  </span>
                )}
                {heroMovie.rating ? (
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent-300">
                    <Star className="h-4 w-4 fill-current" />
                    {heroMovie.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <h1 className="mb-5 max-w-3xl text-5xl font-black text-white md:text-7xl">
                {heroMovie.title}
              </h1>
              <p className="mb-6 max-w-2xl text-lg leading-8 text-slate-200">
                {heroMovie.description}
              </p>
              <div className="mb-8 flex flex-wrap gap-3 text-sm text-slate-300">
                <span>
                  {heroMovie.genre
                    ? heroMovie.genre.join(", ")
                    : "Tidak ada genre"}
                </span>
                <span>&bull;</span>
                <span>{heroMovie.duration} minutes</span>
                <span>&bull;</span>
                <span>{new Date(heroMovie.release_date ? new Date(heroMovie.release_date) : "TBA").getFullYear()}</span>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link
                  to={`/book/${heroMovie._id}`}
                  className="btn btn-primary text-lg px-8 py-3"
                >
                  <Ticket className="h-5 w-5 mr-2" />
                  Buy Tickets
                </Link>
                <Link
                  to={`/movies/${heroMovie._id}`}
                  className="btn btn-secondary text-lg px-8 py-3"
                >
                  <Play className="h-5 w-5 mr-2" />
                  View Details
                </Link>
              </div>
              {heroSlides.length > 1 && (
                <div className="mt-10 flex items-center gap-3">
                  {heroSlides.map((movie, index) => (
                    <button
                      key={movie._id}
                      type="button"
                      onClick={() => setFeaturedMovie(index)}
                      className={`h-1.5 rounded-full transition-all ${index === featuredMovie ? "w-12 bg-primary-500" : "w-7 bg-white/35 hover:bg-white/60"}`}
                      aria-label={`Show ${movie.title}`}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="hidden lg:block">
              <div
                ref={heroPosterRef}
                className="relative mx-auto w-full max-w-[310px] overflow-hidden rounded border border-white/15 bg-black/35 p-3 shadow-2xl shadow-black/60 backdrop-blur"
              >
                <img
                  src={heroMovie.poster || heroMovie.poster_url}
                  alt={heroMovie.title}
                  className="aspect-[2/3] w-full rounded object-cover"
                />
                <div className="absolute inset-x-3 bottom-3 rounded-b bg-gradient-to-t from-black via-black/75 to-transparent p-5 pt-20">
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-primary-400">
                    Featured
                  </p>
                  <p className="mt-1 text-lg font-black text-white">
                    {heroMovie.title}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Now Showing Section */}
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-eyebrow mb-3">Now Showing</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Now Playing
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Explore the latest movies, check show details, and reserve your seats.
              </p>
            </div>
            <Link to="/movies" className="btn btn-secondary">
              Browse All
            </Link>
          </div>

          {error && (
            <div className="card p-4 mb-8 text-red-300 border-red-500/40">
              {error}
            </div>
          )}

          {nowShowing.length > 0 ? (
            <>
              <MovieRail
                movies={nowShowing}
                showtimeMovieIds={showtimeMovieIds}
              />
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                No movies currently showing.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Coming Soon Section */}
      <section className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="section-eyebrow mb-3">Coming Soon</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white">
                Coming Soon to Theaters
              </h2>
              <p className="mt-3 max-w-2xl text-slate-400">
                Discover movies that are coming soon and see what’s next on the big screen.
              </p>
            </div>
          </div>
          {comingSoon.length > 0 ? (
            <MovieRail
              movies={comingSoon}
              showtimeMovieIds={showtimeMovieIds}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">
                No coming soon movies in demo data.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MovieRail({ movies, showtimeMovieIds }) {
  const railRef = useRef(null);
  const isJumpingRef = useRef(false);
  const draggedClickRef = useRef(false);
  const dragRef = useRef({
    active: false,
    moved: false,
    startX: 0,
    scrollLeft: 0,
  });

  const loopedMovies = movies.length > 1 ? [...movies, ...movies, ...movies] : movies;

  const normalizeScroll = () => {
    const rail = railRef.current;
    if (!rail || movies.length <= 1 || isJumpingRef.current) return;

    const segmentWidth = rail.scrollWidth / 3;
    if (!segmentWidth) return;

    if (rail.scrollLeft < segmentWidth * 0.08) {
      isJumpingRef.current = true;
      rail.scrollLeft += segmentWidth;
      window.requestAnimationFrame(() => {
        isJumpingRef.current = false;
      });
    } else if (rail.scrollLeft > segmentWidth * 1.92) {
      isJumpingRef.current = true;
      rail.scrollLeft -= segmentWidth;
      window.requestAnimationFrame(() => {
        isJumpingRef.current = false;
      });
    }
  };

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || movies.length <= 1) return;

    const scrollToMiddle = () => {
      rail.scrollLeft = rail.scrollWidth / 3;
    };

    scrollToMiddle();
    window.requestAnimationFrame(scrollToMiddle);
  }, [movies.length]);

  if (!movies.length) return null;

  const scrollRail = (direction) => {
    const rail = railRef.current;
    if (!rail) return;

    rail.scrollBy({
      left: direction * rail.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  const handlePointerDown = (event) => {
    if (event.button !== 0 || !railRef.current) return;
    if (event.target.closest("a, button")) {
      dragRef.current.active = false;
      draggedClickRef.current = false;
      return;
    }

    draggedClickRef.current = false;

    dragRef.current = {
      active: true,
      moved: false,
      startX: event.clientX,
      scrollLeft: railRef.current.scrollLeft,
    };
    railRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event) => {
    const rail = railRef.current;
    const drag = dragRef.current;
    if (!rail || !drag.active) return;

    const deltaX = event.clientX - drag.startX;
    if (Math.abs(deltaX) > 4) {
      drag.moved = true;
      draggedClickRef.current = true;
      event.preventDefault();
    }

    rail.scrollLeft = drag.scrollLeft - deltaX;
  };

  const handlePointerUp = (event) => {
    const rail = railRef.current;
    const drag = dragRef.current;
    if (!rail || !drag.active) return;

    drag.active = false;
    rail.releasePointerCapture(event.pointerId);
    normalizeScroll();
  };

  const handleClickCapture = (event) => {
    if (!draggedClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
    draggedClickRef.current = false;
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => scrollRail(-1)}
        disabled={movies.length <= 1}
        className="absolute left-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-dark-950/90 p-2 text-white shadow-lg transition hover:bg-primary-500 sm:inline-flex"
        aria-label="Scroll film ke kiri"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <div
        ref={railRef}
        className="cinema-row infinite-card-rail"
        onScroll={normalizeScroll}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onClickCapture={handleClickCapture}
      >
        {loopedMovies.map((movie, index) => (
          <div
            className="movie-reveal-card w-[215px] flex-none sm:w-[235px] lg:w-[250px]"
            key={`${movie._id}-${index}`}
          >
            <MovieCard
              movie={movie}
              hasShowtimes={
                movie.status === "now_showing" &&
                (showtimeMovieIds.has(movie._id) || movie.release === true)
              }
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => scrollRail(1)}
        disabled={movies.length <= 1}
        className="absolute right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/20 bg-dark-950/90 p-2 text-white shadow-lg transition hover:bg-primary-500 sm:inline-flex"
        aria-label="Scroll film ke kanan"
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}
