import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

// Sample movie data - Replace with actual data from your API
const movies = [
  {
    id: 1,
    title: 'Kaantha',
    poster: 'https://placehold.co/300x450/1a1a2e/FFFFFF?text=KAANTHA',
    rating: 8.3,
    votes: '8.2K+',
    genres: 'Drama/Period/Thriller',
  },
  {
    id: 2,
    title: 'Kumki 2',
    poster: 'https://placehold.co/300x450/8B7355/FFFFFF?text=KUMKI+2',
    rating: 6.6,
    votes: '85+',
    genres: 'Adventure/Drama/Musical',
  },
  {
    id: 3,
    title: 'Aan Paavam Pollathathu',
    poster: 'https://placehold.co/300x450/DC143C/FFFFFF?text=AAN+PAAVAM',
    rating: 8.8,
    votes: '9.1K+',
    genres: 'Comedy/Drama',
  },
  {
    id: 4,
    title: 'Bison Kaalamaadan',
    poster: 'https://placehold.co/300x450/8B0000/FFFFFF?text=BISON',
    rating: 9.1,
    votes: '39.6K+',
    genres: 'Action/Crime/Drama',
  },
  {
    id: 5,
    title: 'Others (2025)',
    poster: 'https://placehold.co/300x450/1a1a2e/FFFFFF?text=OTHERS',
    rating: 9.5,
    votes: '1.1K+',
    genres: 'Crime/Thriller',
  },
  {
    id: 6,
    title: 'New Release',
    poster: 'https://placehold.co/300x450/4A3F8B/FFFFFF?text=NEW+MOVIE',
    rating: 8.0,
    votes: '5.2K+',
    genres: 'Action/Drama',
  },
];

const MovieCard = ({ movie }) => {
  return (
    <div className="group cursor-pointer flex-shrink-0 w-full">
      <div className="relative overflow-hidden rounded-lg">
        {/* Movie Poster */}
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-full h-auto aspect-[2/3] object-cover transition-transform duration-300 group-hover:scale-105"
        />

        {/* Rating Badge */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <div className="flex items-center gap-1 text-white">
            <Star className="w-4 h-4 fill-red-500 text-red-500" />
            <span className="font-semibold text-sm">
              {movie.rating}/10
            </span>
            <span className="text-xs text-gray-300 ml-1">
              {movie.votes} Votes
            </span>
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="mt-3 px-1">
        <h3 className="font-semibold text-base md:text-lg text-gray-900 dark:text-white line-clamp-1">
          {movie.title}
        </h3>
        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1">
          {movie.genres}
        </p>
      </div>
    </div>
  );
};

const MoviesList = ({ title = "Recommended Movies", movies: customMovies }) => {
  const displayMovies = customMovies || movies;

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
              {displayMovies.map((movie) => (
                <div
                  key={movie.id}
                  className="w-[160px] sm:w-[180px] md:w-[200px] lg:w-[220px] flex-shrink-0"
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
