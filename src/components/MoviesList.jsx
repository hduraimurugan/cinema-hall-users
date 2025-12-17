import { useState, useEffect, useMemo } from 'react';
import { Star } from 'lucide-react';
import { customerMoviesAPI } from '../services/api';
import { Skeleton } from './ui/skeleton';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const MovieCardSkeleton = () => {
  return (
    <div className="flex-shrink-0 w-full">
      <Skeleton className="w-full aspect-[2/3] rounded-lg" />
      <div className="mt-3 px-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
};

const MovieCard = ({ movie }) => {
  // Format genres array to string
  const genresText = Array.isArray(movie.genre) ? movie.genre.join('/') : movie.genre || 'N/A';

  // Format language array to string
  const languageText = Array.isArray(movie.language) ? movie.language.join(', ') : movie.language || 'N/A';

  return (
    <div className="group cursor-pointer flex-shrink-0 w-full">
      <div className="relative overflow-hidden rounded-lg">
        {/* Movie Poster with Lazy Loading */}
        <LazyLoadImage
          src={movie.poster_url || 'https://placehold.co/300x450/1a1a2e/FFFFFF?text=No+Poster'}
          alt={movie.title}
          effect="blur"
          className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
          wrapperClassName="w-full"
        />

        {/* Rating Badge - Optional if you have ratings */}
        {movie.rating && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
            <div className="flex items-center gap-1 text-white">
              <Star className="w-4 h-4 fill-red-500 text-red-500" />
              <span className="font-semibold text-sm">
                {movie.rating}/10
              </span>
              {movie.votes && (
                <span className="text-xs text-gray-300 ml-1">
                  {movie.votes} Votes
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Movie Info */}
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white line-clamp-1">
          {movie.title}
        </h3>
        <p className="text-xs md:text-xs text-gray-600 dark:text-gray-400 mt-1">
          {genresText}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
          {languageText}
        </p>
      </div>
    </div>
  );
};

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

  // Memoize filters to avoid unnecessary re-renders
  const filtersKey = useMemo(() => JSON.stringify(filters), [filters]);

  useEffect(() => {
    const fetchMovies = async () => {
      // If custom movies are provided, use them directly
      if (customMovies) {
        setMovies(customMovies);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        let response;

        // Fetch based on location or all movies
        if (district && state) {
          response = await customerMoviesAPI.getMoviesByLocation(district, state);
        } else if (state) {
          response = await customerMoviesAPI.getMoviesByState(state);
        } else {
          // Fetch all movies with optional filters
          response = await customerMoviesAPI.getAllMovies({
            status: 'now_showing',
            limit: 20,
            ...filters
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
  }, [customMovies, district, state, filters, filtersKey]);

  // Loading state with skeletons
  if (loading) {
    return (
      <section className="w-full py-6 px-3 md:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Title Skeleton */}
          <Skeleton className="h-8 w-64 mb-6" />

          {/* Movies Grid Skeleton - Horizontal Scrollable */}
          <div className="relative">
            <div className="overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-4 md:gap-6">
                {[...Array(6)].map((_, index) => (
                  <div
                    key={index}
                    className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0"
                  >
                    <MovieCardSkeleton />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="w-full py-6 px-3 md:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  // No movies state
  if (!movies || movies.length === 0) {
    return (
      <section className="w-full py-6 px-3 md:px-6 lg:px-8">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">No movies available at the moment.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full py-6 px-3 md:px-6 lg:px-8">
      <div className="max-w-[1400px] mx-auto">
        {/* Section Title */}
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {title}
        </h2>

        {/* Movies Grid - Horizontal Scrollable */}
        <div className="relative">
          <div className="overflow-x-auto pb-4 scrollbar-hide">
            <div className="flex gap-4 md:gap-6">
              {movies.map((movie) => (
                <div
                  key={movie.id}
                  className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0 gap-4"
                >
                  <MovieCard movie={movie} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
};

export default MoviesList;
