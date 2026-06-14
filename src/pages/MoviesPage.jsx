import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdBanner from '../components/AdBanner';
import MoviesList from '../components/MoviesList';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { customerMoviesAPI } from '../services/api';
import { Star, Clock, Ticket, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'now_showing', label: 'Now Showing' },
  { id: 'upcoming', label: 'Coming Soon' },
];

const AUTOPLAY_INTERVAL = 5000;

const formatDuration = (mins) => {
  if (!mins) return '';
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

const HeroSlide = ({ movie, isActive }) => {
  const navigate = useNavigate();

  const genresText = Array.isArray(movie.genre)
    ? movie.genre.join(' \u2022 ')
    : movie.genre || '';
  const languageText = Array.isArray(movie.language)
    ? movie.language.join(', ')
    : movie.language || '';

  return (
    <div
      className={cn(
        'absolute inset-0 transition-all duration-400',
        isActive
          ? 'opacity-100 scale-100'
          : 'opacity-0 scale-105 pointer-events-none'
      )}
      inert={isActive ? undefined : ''}
    >
      <div className="absolute inset-0">
        <LazyLoadImage
          src={
            movie.poster_url ||
            'https://placehold.co/1200x600/1a1a2e/FFFFFF?text=No+Poster'
          }
          alt=""
          effect="blur"
          className="w-full h-full object-cover"
          wrapperClassName="w-full h-full block"
        />
        <div className="absolute inset-0 hero-gradient-t" />
        <div className="absolute inset-0 hero-gradient-r" />
      </div>

      <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16 sm:pb-20 lg:pb-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.15em] px-3 py-1 rounded-full mb-4 shadow-sm featured-glow">
            <span className="w-1.5 h-1.5 rounded-full bg-white/90 animate-pulse" aria-hidden="true" />
            Now Trending
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-foreground leading-[1.1] tracking-tight mb-3">
            {movie.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground mb-4">
            {movie.rating && (
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-rating text-rating" />
                <span className="font-semibold text-foreground">{movie.rating}</span>
              </span>
            )}
            {formatDuration(movie.duration_mins) && (
              <span className="flex items-center gap-1">
                <Clock className="size-3.5" />
                {formatDuration(movie.duration_mins)}
              </span>
            )}
            {languageText && <span>{languageText}</span>}
          </div>

          {genresText && (
            <p className="text-sm text-muted-foreground/80 mb-6 max-w-lg leading-relaxed">
              {genresText}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/movie/shows/${movie.id}`);
              }}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary text-primary-foreground font-bold px-6 py-3 rounded-xl transition-all duration-200 shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.97] cursor-pointer"
            >
              <Ticket className="size-4" />
              Book Now
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/movie/${movie.id}`);
              }}
              className="inline-flex items-center gap-1 text-sm font-semibold text-foreground/70 hover:text-foreground transition-colors duration-200 cursor-pointer group"
            >
              View Details
              <ChevronRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HeroCarousel = ({ movies }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  const goTo = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % movies.length);
  }, [movies.length]);

  useEffect(() => {
    if (movies.length <= 1 || isPaused) {
      clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(goNext, AUTOPLAY_INTERVAL);
    return () => clearInterval(intervalRef.current);
  }, [movies.length, isPaused, goNext]);

  return (
    <div
      className="relative w-full h-[50vh] sm:h-[55vh] lg:h-[65vh] xl:h-[70vh] min-h-[420px] overflow-hidden bg-muted"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      role="region"
      aria-label="Featured movies"
      aria-roledescription="carousel"
    >
      {/* Slides */}
      {movies.map((movie, idx) => (
        <HeroSlide key={movie.id} movie={movie} isActive={idx === currentIndex} />
      ))}

      {/* Dot indicators */}
      {movies.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
          {movies.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              aria-label={`Go to slide ${idx + 1}`}
              aria-current={idx === currentIndex ? 'true' : undefined}
              className={cn(
                'rounded-full transition-all duration-300 cursor-pointer',
                idx === currentIndex
                  ? 'bg-white w-7 sm:w-9 h-2 shadow-sm hover:scale-110'
                  : 'bg-white/35 hover:bg-white/55 w-2 h-2 hover:scale-125'
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const HeroSkeleton = () => (
  <div className="relative w-full h-[50vh] sm:h-[55vh] lg:h-[65vh] xl:h-[70vh] min-h-[420px] overflow-hidden bg-muted">
    <div className="w-full h-full shimmer" />
    <div className="absolute inset-0 hero-gradient-t" />
    <div className="absolute inset-0 hero-gradient-r" />
    <div className="relative h-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-16 sm:pb-20 lg:pb-24">
      <div className="max-w-2xl space-y-4">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-12 sm:h-14 lg:h-16 w-full max-w-lg" />
        <Skeleton className="h-4 w-72" />
        <Skeleton className="h-4 w-56" />
        <div className="flex gap-3 pt-2">
          <Skeleton className="h-12 w-36 rounded-xl" />
          <Skeleton className="h-12 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

const MoviesPage = () => {
  const { customer } = useCustomerAuth();
  const [activeTab, setActiveTab] = useState('now_showing');
  const [heroMovies, setHeroMovies] = useState([]);
  const [heroLoading, setHeroLoading] = useState(true);

  const customerDistrict = customer?.district;
  const customerState = customer?.state;

  useEffect(() => {
    let cancelled = false;
    const fetchHero = async () => {
      try {
        const response = await customerMoviesAPI.getAllMovies({
          status: 'now_showing',
          limit: 8,
        });
        if (cancelled) return;
        const movies = response.movies || [];
        const sorted = [...movies].sort((a, b) => (b.rating || 0) - (a.rating || 0));
        setHeroMovies(sorted.slice(0, 5));
      } catch {
        if (!cancelled) setHeroMovies([]);
      } finally {
        if (!cancelled) setHeroLoading(false);
      }
    };
    fetchHero();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="pb-10">
      {/* Hero Carousel */}
      {heroLoading ? (
        <HeroSkeleton />
      ) : heroMovies.length > 0 ? (
        <HeroCarousel movies={heroMovies} />
      ) : null}

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header with tabs and location */}
        <div
          className={cn(
            'flex flex-col sm:flex-row sm:items-center justify-between gap-4',
            heroMovies.length > 0 ? 'mt-2' : 'mt-6'
          )}
        >
          <div className="flex items-center gap-2 bg-muted/70 p-1 rounded-xl w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'relative px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer',
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
                aria-pressed={activeTab === tab.id}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {(customerDistrict || customerState) && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span>Showing near</span>
              <span className="font-semibold text-foreground">
                {customerDistrict && customerState
                  ? `${customerDistrict}, ${customerState}`
                  : customerDistrict || customerState}
              </span>
            </div>
          )}
        </div>

        <AdBanner />

        <div className="mt-8 space-y-10">
          <MoviesList
            key={activeTab}
            title={activeTab === 'now_showing' ? 'Now Showing' : 'Coming Soon'}
            filters={{ status: activeTab, limit: 20 }}
          />
        </div>
      </div>
    </div>
  );
};

export default MoviesPage;
