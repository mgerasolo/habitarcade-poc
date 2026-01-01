import { useState, useMemo, memo } from 'react';
import { QUOTES, QUOTE_CATEGORIES, type Quote, type QuoteCategory } from './quotesData';

interface QuoteLibraryProps {
  favorites: string[];
  onToggleFavorite: (quoteId: string) => void;
  onSelectQuote?: (quote: Quote) => void;
  onClose: () => void;
}

type TabType = 'all' | 'favorites';

/**
 * QuoteLibrary - Browse and manage quotes
 */
export const QuoteLibrary = memo(function QuoteLibrary({
  favorites,
  onToggleFavorite,
  onSelectQuote,
  onClose,
}: QuoteLibraryProps) {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedCategory, setSelectedCategory] = useState<QuoteCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  // Filter quotes based on current filters
  const filteredQuotes = useMemo(() => {
    let result = QUOTES;

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((q) => q.category === selectedCategory);
    }

    // Filter by favorites tab
    if (activeTab === 'favorites') {
      result = result.filter((q) => favoritesSet.has(q.id));
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (q) =>
          q.text.toLowerCase().includes(query) ||
          q.author.toLowerCase().includes(query)
      );
    }

    return result;
  }, [selectedCategory, activeTab, searchQuery, favoritesSet]);

  const categories = Object.entries(QUOTE_CATEGORIES) as [QuoteCategory, { label: string; color: string }][];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-condensed font-semibold text-slate-200">Quote Library</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-700/50 transition-colors"
          title="Close library"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`
            px-3 py-1.5 text-xs font-condensed rounded-md
            transition-colors
            ${
              activeTab === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }
          `}
        >
          All Quotes
          <span className="ml-1.5 opacity-60">({QUOTES.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`
            px-3 py-1.5 text-xs font-condensed rounded-md
            transition-colors
            ${
              activeTab === 'favorites'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }
          `}
        >
          Favorites
          <span className="ml-1.5 opacity-60">({favorites.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <input
          type="text"
          placeholder="Search quotes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="
            w-full px-3 py-2 pl-9
            text-xs text-slate-200
            bg-slate-800/50 border border-slate-700/50
            rounded-md
            placeholder:text-slate-500
            focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/20
          "
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Category filter (only show for All tab) */}
      {activeTab === 'all' && (
        <div className="flex flex-wrap gap-1 mb-3">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`
              px-2 py-1 text-[10px] rounded-full
              transition-colors
              ${
                selectedCategory === 'all'
                  ? 'bg-slate-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
              }
            `}
          >
            All
          </button>
          {categories.map(([key, { label, color }]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`
                px-2 py-1 text-[10px] rounded-full
                transition-colors
                ${
                  selectedCategory === key
                    ? `${color} bg-slate-700`
                    : 'bg-slate-800/50 text-slate-500 hover:text-slate-300'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Quotes list */}
      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
        {filteredQuotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="text-slate-600 mb-2">
              <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
            </div>
            <p className="text-xs text-slate-500">
              {activeTab === 'favorites'
                ? 'No favorite quotes yet'
                : 'No quotes found'}
            </p>
            {activeTab === 'favorites' && (
              <p className="text-[10px] text-slate-600 mt-1">
                Click the heart icon to save quotes
              </p>
            )}
          </div>
        ) : (
          filteredQuotes.map((quote) => (
            <QuoteListItem
              key={quote.id}
              quote={quote}
              isFavorite={favoritesSet.has(quote.id)}
              onToggleFavorite={() => onToggleFavorite(quote.id)}
              onSelect={onSelectQuote ? () => onSelectQuote(quote) : undefined}
            />
          ))
        )}
      </div>

      {/* Results count */}
      <div className="mt-2 pt-2 border-t border-slate-700/30">
        <span className="text-[10px] text-slate-500">
          {filteredQuotes.length} quote{filteredQuotes.length !== 1 ? 's' : ''}
        </span>
      </div>
    </div>
  );
});

/**
 * Individual quote list item
 */
interface QuoteListItemProps {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onSelect?: () => void;
}

const QuoteListItem = memo(function QuoteListItem({
  quote,
  isFavorite,
  onToggleFavorite,
  onSelect,
}: QuoteListItemProps) {
  const categoryInfo = QUOTE_CATEGORIES[quote.category];

  return (
    <div
      className={`
        group relative
        p-2.5
        bg-slate-800/30
        border border-slate-700/20
        rounded-md
        hover:border-slate-600/30
        transition-all
        ${onSelect ? 'cursor-pointer hover:bg-slate-800/50' : ''}
      `}
      onClick={onSelect}
    >
      {/* Quote text */}
      <p className="text-xs text-slate-300 italic pr-8">{quote.text}</p>

      {/* Author and category */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] text-slate-500">- {quote.author}</span>
        <span className={`text-[9px] ${categoryInfo.color}`}>{categoryInfo.label}</span>
      </div>

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite();
        }}
        className={`
          absolute top-2 right-2
          p-1.5 rounded-full
          transition-all
          ${
            isFavorite
              ? 'text-rose-400 bg-rose-400/10'
              : 'text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100'
          }
        `}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className="w-3.5 h-3.5"
          fill={isFavorite ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      </button>
    </div>
  );
});

export default QuoteLibrary;
