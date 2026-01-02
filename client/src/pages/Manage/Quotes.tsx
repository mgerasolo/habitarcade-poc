import { useState, useMemo } from 'react';
import * as MuiIcons from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useQuotes,
  useQuoteCategories,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  useToggleFavorite,
  useImportQuotes,
} from '../../api';
import type { Quote } from '../../types';

// Default quote categories
const DEFAULT_CATEGORIES = [
  'Motivational',
  'Productivity',
  'Mindset',
  'Success',
  'Wisdom',
  'Creativity',
  'Perseverance',
];

// Helper to capitalize category names
const capitalizeCategory = (category: string): string => {
  if (!category) return '';
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
};

// Starter quotes for new users
const STARTER_QUOTES: Partial<Quote>[] = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", category: "Motivational" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius", category: "Perseverance" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill", category: "Success" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt", category: "Motivational" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", category: "Mindset" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins", category: "Motivational" },
  { text: "What you get by achieving your goals is not as important as what you become by achieving your goals.", author: "Zig Ziglar", category: "Wisdom" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown", category: "Mindset" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb", category: "Wisdom" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", category: "Productivity" },
];

export function ManageQuotes() {
  // State
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Form state
  const [formText, setFormText] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formCategory, setFormCategory] = useState('');

  // API hooks
  const { data: quotesData, isLoading, refetch } = useQuotes({
    search: search || undefined,
    category: filterCategory || undefined,
    favorites: showFavoritesOnly || undefined,
    limit: 100,
  });
  const { data: categoriesData } = useQuoteCategories();
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const toggleFavorite = useToggleFavorite();
  const importQuotes = useImportQuotes();

  const quotes = quotesData?.data || [];
  const existingCategories = categoriesData?.data || [];

  // Combine existing categories with defaults
  const allCategories = useMemo(() => {
    const combined = new Set([...DEFAULT_CATEGORIES, ...existingCategories]);
    return Array.from(combined).sort();
  }, [existingCategories]);

  // Reset form
  const resetForm = () => {
    setFormText('');
    setFormAuthor('');
    setFormSource('');
    setFormCategory('');
    setEditingQuote(null);
    setShowAddForm(false);
  };

  // Open edit form
  const openEditForm = (quote: Quote) => {
    setFormText(quote.text);
    setFormAuthor(quote.author || '');
    setFormSource(quote.source || '');
    setFormCategory(quote.category || '');
    setEditingQuote(quote);
    setShowAddForm(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formText.trim()) {
      toast.error('Quote text is required');
      return;
    }

    try {
      if (editingQuote) {
        await updateQuote.mutateAsync({
          id: editingQuote.id,
          text: formText.trim(),
          author: formAuthor.trim() || undefined,
          source: formSource.trim() || undefined,
          category: formCategory || undefined,
        });
        toast.success('Quote updated');
      } else {
        await createQuote.mutateAsync({
          text: formText.trim(),
          author: formAuthor.trim() || undefined,
          source: formSource.trim() || undefined,
          category: formCategory || undefined,
        });
        toast.success('Quote added');
      }
      resetForm();
    } catch {
      toast.error('Failed to save quote');
    }
  };

  // Handle delete
  const handleDelete = async (quote: Quote) => {
    if (!confirm(`Delete this quote by ${quote.author || 'Unknown'}?`)) return;

    try {
      await deleteQuote.mutateAsync(quote.id);
      toast.success('Quote deleted');
    } catch {
      toast.error('Failed to delete quote');
    }
  };

  // Handle toggle favorite
  const handleToggleFavorite = async (quote: Quote) => {
    try {
      await toggleFavorite.mutateAsync(quote.id);
    } catch {
      toast.error('Failed to update favorite');
    }
  };

  // Import starter quotes
  const handleImportStarters = async () => {
    try {
      await importQuotes.mutateAsync(STARTER_QUOTES);
      toast.success('Starter quotes imported!');
      refetch();
    } catch {
      toast.error('Failed to import quotes');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <MuiIcons.FormatQuote style={{ fontSize: 32 }} className="text-teal-400" />
            Quote Library
          </h1>
          <p className="text-slate-400 mt-1">
            Manage your collection of inspirational quotes
          </p>
        </div>
        <div className="flex gap-2">
          {quotes.length === 0 && (
            <button
              onClick={handleImportStarters}
              disabled={importQuotes.isPending}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <MuiIcons.AutoAwesome style={{ fontSize: 18 }} />
              Import Starters
            </button>
          )}
          <button
            onClick={() => {
              resetForm();
              setShowAddForm(true);
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <MuiIcons.Add style={{ fontSize: 20 }} />
            Add Quote
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <MuiIcons.Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            style={{ fontSize: 20 }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search quotes..."
            className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Category filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {capitalizeCategory(cat)}
            </option>
          ))}
        </select>

        {/* Favorites filter */}
        <button
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
            showFavoritesOnly
              ? 'bg-pink-500/20 border-pink-500 text-pink-400'
              : 'bg-slate-700/50 border-slate-600 text-slate-400 hover:text-pink-400'
          }`}
        >
          {showFavoritesOnly ? (
            <MuiIcons.Favorite style={{ fontSize: 18 }} />
          ) : (
            <MuiIcons.FavoriteBorder style={{ fontSize: 18 }} />
          )}
          Favorites
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">
            {editingQuote ? 'Edit Quote' : 'Add New Quote'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Quote Text *</label>
              <textarea
                value={formText}
                onChange={(e) => setFormText(e.target.value)}
                placeholder="Enter the quote..."
                rows={3}
                className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                required
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-slate-300 mb-1">Author</label>
                <input
                  type="text"
                  value={formAuthor}
                  onChange={(e) => setFormAuthor(e.target.value)}
                  placeholder="Who said it?"
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Source</label>
                <input
                  type="text"
                  value={formSource}
                  onChange={(e) => setFormSource(e.target.value)}
                  placeholder="Book, movie, etc."
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-300 mb-1">Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">No category</option>
                  {allCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {capitalizeCategory(cat)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createQuote.isPending || updateQuote.isPending}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors flex items-center gap-2"
              >
                {(createQuote.isPending || updateQuote.isPending) && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {editingQuote ? 'Save Changes' : 'Add Quote'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quotes List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : quotes.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <MuiIcons.FormatQuote style={{ fontSize: 64 }} className="opacity-30 mb-4" />
          <p className="text-lg">
            {search || filterCategory || showFavoritesOnly
              ? 'No quotes match your filters'
              : 'No quotes yet. Add some to get started!'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div
              key={quote.id}
              className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors group"
            >
              <div className="flex gap-4">
                {/* Quote content */}
                <div className="flex-1 min-w-0">
                  <p className="text-lg text-slate-200 font-serif italic mb-2">
                    "{quote.text}"
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    {quote.author && (
                      <span>— {quote.author}</span>
                    )}
                    {quote.source && (
                      <span className="text-slate-500">({quote.source})</span>
                    )}
                    {quote.category && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-700/50 text-xs">
                        {capitalizeCategory(quote.category)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleToggleFavorite(quote)}
                    className={`p-2 rounded-lg transition-colors ${
                      quote.isFavorite
                        ? 'text-pink-400 bg-pink-500/20'
                        : 'text-slate-400 hover:text-pink-400 hover:bg-slate-700'
                    }`}
                    title={quote.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {quote.isFavorite ? (
                      <MuiIcons.Favorite style={{ fontSize: 18 }} />
                    ) : (
                      <MuiIcons.FavoriteBorder style={{ fontSize: 18 }} />
                    )}
                  </button>
                  <button
                    onClick={() => openEditForm(quote)}
                    className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Edit quote"
                  >
                    <MuiIcons.Edit style={{ fontSize: 18 }} />
                  </button>
                  <button
                    onClick={() => handleDelete(quote)}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                    title="Delete quote"
                  >
                    <MuiIcons.Delete style={{ fontSize: 18 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {quotes.length > 0 && (
        <div className="mt-6 text-center text-sm text-slate-500">
          Showing {quotes.length} quote{quotes.length !== 1 ? 's' : ''}
          {quotesData?.total && quotesData.total > quotes.length && (
            <span> of {quotesData.total}</span>
          )}
        </div>
      )}
    </div>
  );
}

export default ManageQuotes;
