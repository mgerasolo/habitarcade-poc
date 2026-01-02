import { useState, useEffect, useCallback } from 'react';
import * as MuiIcons from '@mui/icons-material';
import { useQuotes, useToggleFavorite, useQuoteCategories } from '../../api';
import type { Quote } from '../../types';

// Helper to capitalize category names
const capitalizeCategory = (category: string): string => {
  if (!category) return '';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

interface QuotesWidgetProps {
  showControls?: boolean;
  autoRotate?: boolean;
  autoRotateInterval?: number; // in seconds
}

/**
 * Quotes Widget - displays inspirational quotes with navigation
 */
export function QuotesWidget({
  showControls = true,
  autoRotate = false,
  autoRotateInterval = 30,
}: QuotesWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch quotes
  const { data: quotesData, isLoading, isError } = useQuotes({
    category: filterCategory || undefined,
    favorites: showFavoritesOnly || undefined,
    limit: 100,
  });

  const { data: categoriesData } = useQuoteCategories();
  const toggleFavorite = useToggleFavorite();

  const quotes = quotesData?.data || [];
  const categories = categoriesData?.data || [];
  const currentQuote: Quote | undefined = quotes[currentIndex];

  // Navigate to next quote
  const nextQuote = useCallback(() => {
    if (quotes.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % quotes.length);
  }, [quotes.length]);

  // Navigate to previous quote
  const prevQuote = useCallback(() => {
    if (quotes.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  }, [quotes.length]);

  // Random quote
  const randomQuote = useCallback(() => {
    if (quotes.length <= 1) return;
    let newIndex = currentIndex;
    while (newIndex === currentIndex) {
      newIndex = Math.floor(Math.random() * quotes.length);
    }
    setCurrentIndex(newIndex);
  }, [quotes.length, currentIndex]);

  // Toggle current quote favorite
  const handleToggleFavorite = useCallback(() => {
    if (!currentQuote) return;
    toggleFavorite.mutate(currentQuote.id);
  }, [currentQuote, toggleFavorite]);

  // Auto-rotate effect
  useEffect(() => {
    if (!autoRotate || quotes.length <= 1) return;

    const interval = setInterval(() => {
      nextQuote();
    }, autoRotateInterval * 1000);

    return () => clearInterval(interval);
  }, [autoRotate, autoRotateInterval, quotes.length, nextQuote]);

  // Reset index when filters change
  useEffect(() => {
    setCurrentIndex(0);
  }, [filterCategory, showFavoritesOnly]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="h-full flex items-center justify-center text-red-400">
        <MuiIcons.ErrorOutline className="mr-2" />
        Failed to load quotes
      </div>
    );
  }

  // No quotes state
  if (quotes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 p-4">
        <MuiIcons.FormatQuote style={{ fontSize: 48, opacity: 0.3 }} />
        <p className="mt-2 text-center">
          {showFavoritesOnly
            ? 'No favorite quotes yet'
            : filterCategory
              ? `No quotes in "${filterCategory}"`
              : 'No quotes yet. Add some in the Quote Library!'}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      {showControls && (
        <div className="flex items-center gap-2 mb-3 px-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="text-xs bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {capitalizeCategory(cat)}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`p-1 rounded transition-colors ${
              showFavoritesOnly
                ? 'text-pink-400 bg-pink-500/20'
                : 'text-slate-400 hover:text-pink-400'
            }`}
            title={showFavoritesOnly ? 'Show all' : 'Show favorites only'}
          >
            {showFavoritesOnly ? (
              <MuiIcons.Favorite style={{ fontSize: 16 }} />
            ) : (
              <MuiIcons.FavoriteBorder style={{ fontSize: 16 }} />
            )}
          </button>
        </div>
      )}

      {/* Quote display */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <MuiIcons.FormatQuote
          className="text-teal-500/30 mb-2"
          style={{ fontSize: 32 }}
        />
        <p className="text-lg font-serif italic text-slate-200 leading-relaxed mb-4">
          "{currentQuote.text}"
        </p>
        {currentQuote.author && (
          <p className="text-sm text-slate-400">
            — {currentQuote.author}
            {currentQuote.source && (
              <span className="text-slate-500">, {currentQuote.source}</span>
            )}
          </p>
        )}
        {currentQuote.category && (
          <span className="mt-2 text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
            {capitalizeCategory(currentQuote.category)}
          </span>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center justify-center gap-3 mt-4 pt-3 border-t border-slate-700/50">
          {/* Favorite button */}
          <button
            onClick={handleToggleFavorite}
            disabled={toggleFavorite.isPending}
            className={`p-2 rounded-full transition-all ${
              currentQuote.isFavorite
                ? 'text-pink-400 bg-pink-500/20 hover:bg-pink-500/30'
                : 'text-slate-400 hover:text-pink-400 hover:bg-slate-700/50'
            }`}
            title={currentQuote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {currentQuote.isFavorite ? (
              <MuiIcons.Favorite style={{ fontSize: 20 }} />
            ) : (
              <MuiIcons.FavoriteBorder style={{ fontSize: 20 }} />
            )}
          </button>

          {/* Previous */}
          <button
            onClick={prevQuote}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Previous quote"
          >
            <MuiIcons.ChevronLeft style={{ fontSize: 24 }} />
          </button>

          {/* Counter */}
          <span className="text-xs text-slate-500 min-w-[60px] text-center">
            {currentIndex + 1} / {quotes.length}
          </span>

          {/* Next */}
          <button
            onClick={nextQuote}
            className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
            title="Next quote"
          >
            <MuiIcons.ChevronRight style={{ fontSize: 24 }} />
          </button>

          {/* Random */}
          <button
            onClick={randomQuote}
            className="p-2 rounded-full text-slate-400 hover:text-teal-400 hover:bg-slate-700/50 transition-colors"
            title="Random quote"
          >
            <MuiIcons.Shuffle style={{ fontSize: 20 }} />
          </button>
        </div>
      )}
    </div>
  );
}

export default QuotesWidget;
