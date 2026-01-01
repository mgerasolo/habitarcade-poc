import { useState, useMemo, useCallback } from 'react';
import { getQuoteOfTheDay, getRandomQuote, QUOTES, type Quote } from './quotesData';
import { QuoteCard } from './QuoteCard';
import { QuoteLibrary } from './QuoteLibrary';
import { useFavoriteQuotes } from './useFavoriteQuotes';

interface QuotesWidgetProps {
  /** Custom class name */
  className?: string;
}

type ViewMode = 'daily' | 'library';

/**
 * Quotes Widget - Display inspirational quotes with a library
 *
 * Features:
 * - Quote of the day (deterministic based on date)
 * - Refresh to get a random quote
 * - Save favorite quotes
 * - Browse quote library by category
 * - Search quotes
 */
export function Quotes({ className = '' }: QuotesWidgetProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [currentQuote, setCurrentQuote] = useState<Quote>(() => getQuoteOfTheDay());
  const { favorites, toggleFavorite, isFavorite } = useFavoriteQuotes();

  // Handle refresh - get a random quote
  const handleRefresh = useCallback(() => {
    let newQuote = getRandomQuote();
    // Avoid getting the same quote
    while (newQuote.id === currentQuote.id && QUOTES.length > 1) {
      newQuote = getRandomQuote();
    }
    setCurrentQuote(newQuote);
  }, [currentQuote.id]);

  // Handle selecting a quote from library
  const handleSelectQuote = useCallback((quote: Quote) => {
    setCurrentQuote(quote);
    setViewMode('daily');
  }, []);

  // Get favorite quotes for library
  const favoriteQuoteIds = useMemo(() => favorites, [favorites]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {viewMode === 'daily' ? (
        <>
          {/* Current quote display */}
          <div className="flex-1">
            <QuoteCard
              quote={currentQuote}
              isFavorite={isFavorite(currentQuote.id)}
              onToggleFavorite={() => toggleFavorite(currentQuote.id)}
              onRefresh={handleRefresh}
              showCategory={true}
            />
          </div>

          {/* Library button */}
          <div className="mt-3 pt-3 border-t border-slate-700/30 flex items-center justify-between">
            <button
              onClick={() => setViewMode('library')}
              className="
                flex items-center gap-2
                px-3 py-1.5
                text-xs text-slate-400
                hover:text-slate-200
                bg-slate-800/30
                hover:bg-slate-800/50
                border border-slate-700/30
                hover:border-slate-600/50
                rounded-md
                transition-colors
              "
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              Browse Library
            </button>

            {/* Favorites count */}
            {favorites.length > 0 && (
              <span className="text-[10px] text-slate-500">
                {favorites.length} favorite{favorites.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </>
      ) : (
        <QuoteLibrary
          favorites={favoriteQuoteIds}
          onToggleFavorite={toggleFavorite}
          onSelectQuote={handleSelectQuote}
          onClose={() => setViewMode('daily')}
        />
      )}
    </div>
  );
}

export default Quotes;
