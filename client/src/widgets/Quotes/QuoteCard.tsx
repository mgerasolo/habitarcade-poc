import { memo } from 'react';
import type { Quote } from './quotesData';
import { QUOTE_CATEGORIES } from './quotesData';

interface QuoteCardProps {
  quote: Quote;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onRefresh?: () => void;
  showCategory?: boolean;
  compact?: boolean;
}

/**
 * QuoteCard - Displays a single quote with favorite toggle
 */
export const QuoteCard = memo(function QuoteCard({
  quote,
  isFavorite,
  onToggleFavorite,
  onRefresh,
  showCategory = true,
  compact = false,
}: QuoteCardProps) {
  const categoryInfo = QUOTE_CATEGORIES[quote.category];

  return (
    <div
      className={`
        relative group
        ${compact ? 'p-3' : 'p-4'}
        bg-gradient-to-br from-slate-800/50 to-slate-900/50
        border border-slate-700/30
        rounded-lg
        transition-all duration-200
        hover:border-slate-600/50
      `}
    >
      {/* Quote icon */}
      <div className="absolute -top-2 -left-1 text-3xl text-slate-700/50 font-serif select-none">
        "
      </div>

      {/* Quote text */}
      <blockquote
        className={`
          relative z-10
          ${compact ? 'text-sm' : 'text-base'}
          text-slate-200
          font-light
          leading-relaxed
          italic
          pl-3
        `}
      >
        {quote.text}
      </blockquote>

      {/* Author and actions */}
      <div className={`flex items-center justify-between ${compact ? 'mt-2' : 'mt-3'}`}>
        <div className="flex items-center gap-2">
          <span className={`${compact ? 'text-xs' : 'text-sm'} text-slate-400`}>
            - {quote.author}
          </span>
          {showCategory && (
            <span
              className={`
                text-[10px] px-1.5 py-0.5
                rounded-full
                bg-slate-800/60
                ${categoryInfo.color}
              `}
            >
              {categoryInfo.label}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-full hover:bg-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
              title="Get new quote"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          )}

          {/* Favorite button */}
          <button
            onClick={onToggleFavorite}
            className={`
              p-1.5 rounded-full transition-all
              ${
                isFavorite
                  ? 'text-rose-400 hover:text-rose-300 bg-rose-400/10'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-slate-700/50'
              }
            `}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <svg
              className="w-4 h-4"
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
      </div>
    </div>
  );
});

/**
 * Compact quote card for favorites list
 */
interface FavoriteQuoteCardProps {
  quote: Quote;
  onRemove: () => void;
}

export const FavoriteQuoteCard = memo(function FavoriteQuoteCard({
  quote,
  onRemove,
}: FavoriteQuoteCardProps) {
  const categoryInfo = QUOTE_CATEGORIES[quote.category];

  return (
    <div
      className="
        group relative
        p-2.5
        bg-slate-800/30
        border border-slate-700/20
        rounded-md
        hover:border-slate-600/30
        transition-all
      "
    >
      {/* Quote text */}
      <p className="text-xs text-slate-300 italic line-clamp-2 pr-6">{quote.text}</p>

      {/* Author */}
      <div className="flex items-center gap-1.5 mt-1.5">
        <span className="text-[10px] text-slate-500">- {quote.author}</span>
        <span className={`text-[9px] ${categoryInfo.color}`}>{categoryInfo.label}</span>
      </div>

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="
          absolute top-2 right-2
          p-1 rounded-full
          text-slate-500 hover:text-rose-400
          hover:bg-slate-700/50
          opacity-0 group-hover:opacity-100
          transition-all
        "
        title="Remove from favorites"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
});

export default QuoteCard;
