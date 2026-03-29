import { useState, useEffect, useMemo, useRef } from 'react';
import { Star, ChevronLeft, ChevronRight, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { Skeleton } from './ui/skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const MovieCardSkeleton = () => (
  <div className="flex-shrink-0 w-full">
    <Skeleton className="w-full aspect-[2/3] rounded-xl" />
    <div className="mt-3 px-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const MovieCard = ({ movie, showBookNow = true }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);

  const genresText = Array.isArray(movie.genre) ? movie.genre.join(' / ') : movie.genre || '';
  const languageText = Array.isArray(movie.language) ? movie.language.join(', ') : movie.language || '';
  const genres = Array.isArray(movie.genre) ? movie.genre : movie.genre ? [movie.genre] : [];

  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group cursor-pointer flex-shrink-0 w-full"
    >
      <div className="relative overflow-hidden rounded-xl shadow-md">
        {/* Poster */}
        <LazyLoadImage
          src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/FFFFFF?text=No+Poster'}
          alt={movie.title}
          effect="blur"
          className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-110"
          wrapperClassName="w-full block"
        />

        {/* Always-visible rating badge */}
        {movie.rating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-0.5">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-white text-xs font-bold">{movie.rating}</span>
          </div>
        )}

        {/* Hover overlay */}
        <div
          className={`absolute inset-0 flex flex-col justify-end p-3 transition-all duration-300 ${
            hovered ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0.1) 100%)',
          }}
        >
          {/* Genre tags */}
          {genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {genres.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-semibold uppercase tracking-wide bg-primary/80 text-white rounded-full px-2 py-0.5"
                >
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Language */}
          {languageText && (
            <p className="text-white/70 text-[11px] mb-2">{languageText}</p>
          )}

          {/* Book Now button */}
          {showBookNow && (
            <div className="flex items-center justify-center gap-1.5 bg-primary hover:bg-primary/90 text-white rounded-lg py-1.5 px-3 text-xs font-semibold transition-colors">
              <Ticket className="w-3.5 h-3.5" />
              Book Now
            </div>
          )}
        </div>
      </div>

      {/* Title below card */}
      <div className="mt-2.5 px-0.5">
        <h3 className="font-semibold text-sm md:text-base text-foreground line-clamp-1 leading-snug">
          {movie.title}
        </h3>
        {genresText && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{genresText}</p>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ title }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <span className="w-1 h-6 rounded-full bg-primary block" />
      <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
  </div>
);

const MoviesList = ({
  title = "Recommended Movies",
  movies: customMovies,
  district,
  state,
  filters = {}
}) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const showBookNow = filters.status !== 'upcoming';

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons);
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      ro.disconnect();
    };
  }, [movies]);

  useEffect(() => {
    const fetchMovies = async () => {
      if (customMovies) {
        setMovies(customMovies);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        let response;
        if (district && state) {
          response = await customerMoviesAPI.getMoviesByLocation(district, state);
        } else if (state) {
          response = await customerMoviesAPI.getMoviesByState(state);
        } else {
          response = await customerMoviesAPI.getAllMovies({
            status: 'now_showing',
            limit: 20,
            ...filters,
          });
        }
        setMovies(response.movies || []);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, [customMovies, district, state, filtersKey]);

  if (loading) {
    return (
      <section className="w-full py-5 px-3 sm:px-6 lg:px-14">
        <div className="max-w-[1400px] mx-auto">
          <div className="flex items-center gap-3 mb-5">
            <span className="w-1 h-6 rounded-full bg-primary/40 block" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="flex gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[140px] sm:w-[160px] md:w-[185px] lg:w-[200px] flex-shrink-0">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full py-5 px-3 sm:px-6 lg:px-14">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader title={title} />
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4">
            <p className="text-destructive text-sm">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <section className="w-full py-5 px-3 sm:px-6 lg:px-14">
        <div className="max-w-[1400px] mx-auto">
          <SectionHeader title={title} />
          <div className="bg-muted rounded-xl p-10 text-center">
            <p className="text-muted-foreground text-sm">No movies available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-5 px-3 sm:px-6 lg:px-14">
      <div className="max-w-[1400px] mx-auto">
        {/* Header with scroll arrows */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-1 h-6 rounded-full bg-primary block" />
            <h2 className="text-lg md:text-xl font-bold text-foreground tracking-tight">{title}</h2>
          </div>

          {/* Scroll arrows — desktop only */}
          <div className="hidden sm:flex items-center gap-1.5">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="p-1.5 rounded-full border border-border bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="p-1.5 rounded-full border border-border bg-card text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable movie row */}
        <div
          ref={scrollRef}
          className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[140px] sm:w-[160px] md:w-[185px] lg:w-[200px] flex-shrink-0"
            >
              <MovieCard movie={movie} showBookNow={showBookNow} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MoviesList;
