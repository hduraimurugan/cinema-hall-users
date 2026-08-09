import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Star, ChevronLeft, ChevronRight, Ticket, Clock, Film, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerMoviesAPI } from '../services/api';
import { Skeleton } from './ui/skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { cn } from '@/lib/utils';

const MovieCardSkeleton = () => (
  <div className="flex-shrink-0 w-full">
    <div className="w-full aspect-[2/3] rounded-2xl shimmer" />
    <div className="mt-3 px-1 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  </div>
);

const formatDuration = (mins) => {
  if (!mins) return '';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const MovieCard = ({ movie, showBookNow = true }) => {
  const navigate = useNavigate();

  const genres = useMemo(
    () => (Array.isArray(movie.genre) ? movie.genre : movie.genre ? [movie.genre] : []),
    [movie.genre]
  );
  const rating = useMemo(() => {
    const value = parseFloat(movie.vote_average);
    return Number.isFinite(value) && value > 0 ? value.toFixed(1) : null;
  }, [movie.vote_average]);
  const languageText = useMemo(
    () => (Array.isArray(movie.language) ? movie.language.join(', ') : movie.language || ''),
    [movie.language]
  );

  const handleClick = useCallback(() => {
    navigate(`/movie/${movie.id}`);
  }, [navigate, movie.id]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleClick();
      }
    },
    [handleClick]
  );

  const handleBookNow = useCallback(
    (e) => {
      e.stopPropagation();
      navigate(`/movie/shows/${movie.id}`);
    },
    [navigate, movie.id]
  );

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`${movie.title}${rating ? `, rated ${rating}` : ''}`}
      className="group cursor-pointer flex-shrink-0 w-full focus-ring"
    >
      <div className="relative overflow-hidden rounded-2xl shadow-md card-hover bg-card border border-border/40 card-glow-border">
        {/* Poster */}
        <LazyLoadImage
          src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/FFFFFF?text=No+Poster'}
          alt={movie.title}
          effect="blur"
          className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-500 group-hover:scale-105"
          wrapperClassName="w-full block"
        />

        {/* Subtle bottom gradient for text readability */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />

        {/* Always-visible rating badge */}
        {rating && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/65 backdrop-blur-md rounded-full pl-1.5 pr-2.5 py-1 shadow-lg shadow-black/20">
            <Star className="w-3.5 h-3.5 fill-rating text-rating" />
            <span className="text-white text-xs font-bold tabular-nums">{rating}</span>
          </div>
        )}

        {/* Genre tags - bottom left, always visible */}
        {genres.length > 0 && (
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
            {genres.slice(0, 2).map((g) => (
              <span
                key={g}
                className="text-[10px] font-semibold uppercase tracking-wider bg-black/55 backdrop-blur-sm text-white/90 rounded-md px-1.5 py-0.5"
              >
                {g}
              </span>
            ))}
          </div>
        )}

        {/* Book Now overlay - appears on hover */}
        {showBookNow && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-gradient-to-t from-black/40 via-black/10 to-transparent">
            <button
              onClick={handleBookNow}
              className="custom-hover inline-flex items-center gap-1.5 bg-primary hover:bg-primary/90 hover:scale-105 active:scale-95 text-primary-foreground rounded-xl py-2.5 px-5 text-xs font-bold shadow-lg shadow-primary/30 transition-all duration-200 scale-90 group-hover:scale-100"
            >
              <Ticket className="w-3.5 h-3.5" />
              Book Now
            </button>
          </div>
        )}
      </div>

      {/* Content below poster */}
      <div className="mt-3 px-0.5">
        <h3 className="font-semibold text-sm md:text-[15px] text-foreground line-clamp-1 leading-snug group-hover:text-primary transition-colors duration-200">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
          {genres.length > 0 && (
            <span className="line-clamp-1 max-w-[55%] font-medium">{genres.slice(0, 2).join(' / ')}</span>
          )}
          {formatDuration(movie.duration_mins) && (
            <>
              <span className="text-border/60" aria-hidden="true">|</span>
              <span className="flex items-center gap-0.5 shrink-0">
                <Clock className="w-3 h-3" />
                {formatDuration(movie.duration_mins)}
              </span>
            </>
          )}
        </div>
        {languageText && (
          <p className="text-[11px] text-muted-foreground/60 mt-1 line-clamp-1">{languageText}</p>
        )}
      </div>
    </div>
  );
};

const SectionHeader = ({ title, onViewAll }) => (
  <div className="flex items-center justify-between mb-5">
    <div className="flex items-center gap-3">
      <span className="w-1 h-7 rounded-full bg-primary block" aria-hidden="true" />
      <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
    </div>
    {onViewAll && (
      <button
        onClick={onViewAll}
        className="group inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors cursor-pointer"
      >
        View All
        <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </button>
    )}
  </div>
);

const MoviesList = ({
  title = 'Recommended Movies',
  movies: customMovies,
  district,
  state,
  filters = {},
}) => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const showBookNow = filters.status !== 'upcoming';

  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  }, []);

  const handleScrollKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        scroll('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        scroll('right');
      }
    },
    [scroll]
  );

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
  }, [movies, updateScrollButtons]);

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
  }, [customMovies, district, state, filtersKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <section className="w-full">
        <div className="flex items-center gap-3 mb-5">
          <span className="w-1 h-7 rounded-full bg-primary/40 block" aria-hidden="true" />
          <Skeleton className="h-6 w-40" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-[150px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0">
              <MovieCardSkeleton />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="w-full">
        <SectionHeader title={title} />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/5 p-12 text-center">
          <Film className="w-10 h-10 text-destructive/40 mb-3" />
          <p className="text-destructive text-sm font-medium">{error}</p>
          <p className="text-muted-foreground text-xs mt-1">Could not load movies. Please try again.</p>
        </div>
      </section>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <section className="w-full">
        <SectionHeader title={title} />
        <div className="flex flex-col items-center justify-center rounded-2xl bg-muted/50 p-12 text-center">
          <Film className="w-10 h-10 text-muted-foreground/40 mb-3" />
          <p className="text-foreground text-sm font-medium">No movies available</p>
          <p className="text-muted-foreground text-xs mt-1">Check back later for new releases.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full">
      {/* Header with scroll arrows */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="w-1 h-7 rounded-full bg-primary block" aria-hidden="true" />
          <h2 className="text-xl md:text-2xl font-bold text-foreground tracking-tight">{title}</h2>
          <span className="hidden sm:inline text-xs text-muted-foreground font-medium">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
          </span>
        </div>

        {/* Scroll arrows - desktop only */}
        <div className="hidden sm:flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
            className="p-2 rounded-full arrow-glass text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            aria-label="Scroll right"
            className="p-2 rounded-full arrow-glass text-foreground disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrollable movie row with fade edges */}
      <div className="relative">
        <div
          className={cn(
            'scroll-fade-left',
            canScrollLeft && 'scroll-fade-visible'
          )}
        />
        <div
          className={cn(
            'scroll-fade-right',
            canScrollRight && 'scroll-fade-visible'
          )}
        />
        <div
          ref={scrollRef}
          role="region"
          aria-label={`${title} movies`}
          tabIndex={0}
          onKeyDown={handleScrollKeyDown}
          className={cn(
            'flex gap-3 sm:gap-4 md:gap-5 overflow-x-auto pb-3 scroll-snap-x',
            'no-scrollbar'
          )}
        >
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="w-[150px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0 scroll-snap-start"
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
