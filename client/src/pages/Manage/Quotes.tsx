import { useState } from 'react';
import * as MuiIcons from '@mui/icons-material';
import toast from 'react-hot-toast';
import {
  useQuotes,
  useQuoteCollections,
  useCreateQuote,
  useUpdateQuote,
  useDeleteQuote,
  useToggleFavorite,
  useImportQuotes,
  useCreateQuoteCollection,
  useUpdateQuoteCollection,
  useDeleteQuoteCollection,
  useSeedQuoteCollections,
} from '../../api';
import type { Quote, QuoteCollection } from '../../types';

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

type TabType = 'quotes' | 'collections';

export function ManageQuotes() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('quotes');

  // Quote state
  const [search, setSearch] = useState('');
  const [filterCollectionId, setFilterCollectionId] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showAddQuoteForm, setShowAddQuoteForm] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  // Quote form state
  const [formText, setFormText] = useState('');
  const [formAuthor, setFormAuthor] = useState('');
  const [formSource, setFormSource] = useState('');
  const [formCollectionIds, setFormCollectionIds] = useState<string[]>([]);

  // Collection state
  const [showAddCollectionForm, setShowAddCollectionForm] = useState(false);
  const [editingCollection, setEditingCollection] = useState<QuoteCollection | null>(null);

  // Collection form state
  const [collectionName, setCollectionName] = useState('');
  const [collectionColor, setCollectionColor] = useState('#14b8a6');
  const [collectionIcon, setCollectionIcon] = useState('Collections');

  // API hooks - Quotes
  const { data: quotesData, isLoading: quotesLoading, refetch: refetchQuotes } = useQuotes({
    search: search || undefined,
    collectionId: filterCollectionId || undefined,
    favorites: showFavoritesOnly || undefined,
    limit: 100,
  });
  const createQuote = useCreateQuote();
  const updateQuote = useUpdateQuote();
  const deleteQuote = useDeleteQuote();
  const toggleFavorite = useToggleFavorite();
  const importQuotes = useImportQuotes();

  // API hooks - Collections
  const { data: collectionsData, isLoading: collectionsLoading } = useQuoteCollections();
  const createCollection = useCreateQuoteCollection();
  const updateCollection = useUpdateQuoteCollection();
  const deleteCollection = useDeleteQuoteCollection();
  const seedCollections = useSeedQuoteCollections();

  const quotes = quotesData?.data || [];
  const collections = collectionsData?.data || [];

  // Color options for collections
  const colorOptions = [
    '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#6b7280',
  ];

  // Icon options for collections
  const iconOptions = [
    'Collections', 'EmojiEvents', 'Speed', 'Psychology', 'TrendingUp',
    'Lightbulb', 'Palette', 'FitnessCenter', 'AutoAwesome', 'Star',
    'Favorite', 'Bolt', 'LocalFireDepartment', 'Diamond', 'Rocket',
  ];

  // Reset quote form
  const resetQuoteForm = () => {
    setFormText('');
    setFormAuthor('');
    setFormSource('');
    setFormCollectionIds([]);
    setEditingQuote(null);
    setShowAddQuoteForm(false);
  };

  // Reset collection form
  const resetCollectionForm = () => {
    setCollectionName('');
    setCollectionColor('#14b8a6');
    setCollectionIcon('Collections');
    setEditingCollection(null);
    setShowAddCollectionForm(false);
  };

  // Open edit quote form
  const openEditQuoteForm = (quote: Quote) => {
    setFormText(quote.text);
    setFormAuthor(quote.author || '');
    setFormSource(quote.source || '');
    setFormCollectionIds(quote.collections?.map(c => c.id) || []);
    setEditingQuote(quote);
    setShowAddQuoteForm(true);
  };

  // Open edit collection form
  const openEditCollectionForm = (collection: QuoteCollection) => {
    setCollectionName(collection.name);
    setCollectionColor(collection.color || '#14b8a6');
    setCollectionIcon(collection.icon || 'Collections');
    setEditingCollection(collection);
    setShowAddCollectionForm(true);
  };

  // Handle quote form submit
  const handleQuoteSubmit = async (e: React.FormEvent) => {
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
          collectionIds: formCollectionIds,
        });
        toast.success('Quote updated');
      } else {
        await createQuote.mutateAsync({
          text: formText.trim(),
          author: formAuthor.trim() || undefined,
          source: formSource.trim() || undefined,
          collectionIds: formCollectionIds,
        });
        toast.success('Quote added');
      }
      resetQuoteForm();
    } catch {
      toast.error('Failed to save quote');
    }
  };

  // Handle collection form submit
  const handleCollectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!collectionName.trim()) {
      toast.error('Collection name is required');
      return;
    }

    try {
      if (editingCollection) {
        await updateCollection.mutateAsync({
          id: editingCollection.id,
          name: collectionName.trim(),
          color: collectionColor,
          icon: collectionIcon,
        });
        toast.success('Collection updated');
      } else {
        await createCollection.mutateAsync({
          name: collectionName.trim(),
          color: collectionColor,
          icon: collectionIcon,
        });
        toast.success('Collection created');
      }
      resetCollectionForm();
    } catch {
      toast.error('Failed to save collection');
    }
  };

  // Handle delete quote
  const handleDeleteQuote = async (quote: Quote) => {
    if (!confirm(`Delete this quote by ${quote.author || 'Unknown'}?`)) return;
    try {
      await deleteQuote.mutateAsync(quote.id);
      toast.success('Quote deleted');
    } catch {
      toast.error('Failed to delete quote');
    }
  };

  // Handle delete collection
  const handleDeleteCollection = async (collection: QuoteCollection) => {
    if (!confirm(`Delete collection "${collection.name}"? Quotes will remain but won't be in this collection.`)) return;
    try {
      await deleteCollection.mutateAsync(collection.id);
      toast.success('Collection deleted');
    } catch {
      toast.error('Failed to delete collection');
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
      refetchQuotes();
    } catch {
      toast.error('Failed to import quotes');
    }
  };

  // Seed default collections
  const handleSeedCollections = async () => {
    try {
      const result = await seedCollections.mutateAsync();
      if (result.seeded) {
        toast.success('Default collections created!');
      } else {
        toast.success('Collections already exist');
      }
    } catch {
      toast.error('Failed to create collections');
    }
  };

  // Toggle collection in form
  const toggleFormCollection = (collectionId: string) => {
    setFormCollectionIds(prev =>
      prev.includes(collectionId)
        ? prev.filter(id => id !== collectionId)
        : [...prev, collectionId]
    );
  };

  // Get icon component
  const getIconComponent = (iconName: string) => {
    const Icon = MuiIcons[iconName as keyof typeof MuiIcons] as React.ComponentType<{ style?: React.CSSProperties; className?: string }>;
    return Icon || MuiIcons.Collections;
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
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700">
        <button
          onClick={() => setActiveTab('quotes')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'quotes'
              ? 'text-teal-400 border-teal-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <MuiIcons.FormatQuote style={{ fontSize: 16 }} className="mr-2 inline" />
          Quotes ({quotes.length})
        </button>
        <button
          onClick={() => setActiveTab('collections')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'collections'
              ? 'text-teal-400 border-teal-400'
              : 'text-slate-400 border-transparent hover:text-white'
          }`}
        >
          <MuiIcons.Collections style={{ fontSize: 16 }} className="mr-2 inline" />
          Collections ({collections.length})
        </button>
      </div>

      {/* Quotes Tab */}
      {activeTab === 'quotes' && (
        <>
          {/* Quote Actions */}
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

            {/* Collection filter */}
            <select
              value={filterCollectionId}
              onChange={(e) => setFilterCollectionId(e.target.value)}
              className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">All Collections</option>
              {collections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.name} ({col.quoteCount || 0})
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

            {/* Add buttons */}
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
                  resetQuoteForm();
                  setShowAddQuoteForm(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <MuiIcons.Add style={{ fontSize: 20 }} />
                Add Quote
              </button>
            </div>
          </div>

          {/* Add/Edit Quote Form */}
          {showAddQuoteForm && (
            <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingQuote ? 'Edit Quote' : 'Add New Quote'}
              </h3>
              <form onSubmit={handleQuoteSubmit} className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                </div>
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Collections</label>
                  {collections.length === 0 ? (
                    <p className="text-sm text-slate-500">
                      No collections yet.{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('collections')}
                        className="text-teal-400 hover:underline"
                      >
                        Create one
                      </button>
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {collections.map((col) => {
                        const isSelected = formCollectionIds.includes(col.id);
                        const IconComp = getIconComponent(col.icon || 'Collections');
                        return (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => toggleFormCollection(col.id)}
                            className={`px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 text-sm ${
                              isSelected
                                ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                                : 'border-slate-600 bg-slate-700/50 text-slate-300 hover:border-slate-500'
                            }`}
                          >
                            <IconComp style={{ fontSize: 14, color: col.color }} />
                            {col.name}
                            {isSelected && <MuiIcons.Check style={{ fontSize: 14 }} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetQuoteForm}
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
          {quotesLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MuiIcons.FormatQuote style={{ fontSize: 64 }} className="opacity-30 mb-4" />
              <p className="text-lg">
                {search || filterCollectionId || showFavoritesOnly
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
                        {quote.author && <span>— {quote.author}</span>}
                        {quote.source && <span className="text-slate-500">({quote.source})</span>}
                        {quote.collections && quote.collections.length > 0 && (
                          <div className="flex gap-1 ml-2">
                            {quote.collections.map((col) => {
                              const IconComp = getIconComponent(col.icon || 'Collections');
                              return (
                                <span
                                  key={col.id}
                                  className="px-2 py-0.5 rounded-full bg-slate-700/50 text-xs flex items-center gap-1"
                                  style={{ borderLeft: `3px solid ${col.color || '#6b7280'}` }}
                                >
                                  <IconComp style={{ fontSize: 12, color: col.color }} />
                                  {col.name}
                                </span>
                              );
                            })}
                          </div>
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
                        onClick={() => openEditQuoteForm(quote)}
                        className="p-2 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"
                        title="Edit quote"
                      >
                        <MuiIcons.Edit style={{ fontSize: 18 }} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuote(quote)}
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
        </>
      )}

      {/* Collections Tab */}
      {activeTab === 'collections' && (
        <>
          {/* Collection Actions */}
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-400">
              Organize quotes into collections for easy filtering
            </p>
            <div className="flex gap-2">
              {collections.length === 0 && (
                <button
                  onClick={handleSeedCollections}
                  disabled={seedCollections.isPending}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <MuiIcons.AutoAwesome style={{ fontSize: 18 }} />
                  Create Defaults
                </button>
              )}
              <button
                onClick={() => {
                  resetCollectionForm();
                  setShowAddCollectionForm(true);
                }}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <MuiIcons.Add style={{ fontSize: 20 }} />
                Add Collection
              </button>
            </div>
          </div>

          {/* Add/Edit Collection Form */}
          {showAddCollectionForm && (
            <div className="mb-6 p-5 bg-slate-800 rounded-xl border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-4">
                {editingCollection ? 'Edit Collection' : 'Add New Collection'}
              </h3>
              <form onSubmit={handleCollectionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-1">Name *</label>
                  <input
                    type="text"
                    value={collectionName}
                    onChange={(e) => setCollectionName(e.target.value)}
                    placeholder="e.g., Morning Motivation"
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setCollectionColor(color)}
                          className={`w-8 h-8 rounded-lg transition-all ${
                            collectionColor === color
                              ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800'
                              : 'hover:scale-110'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-300 mb-2">Icon</label>
                    <div className="flex flex-wrap gap-2">
                      {iconOptions.map((iconName) => {
                        const IconComp = getIconComponent(iconName);
                        return (
                          <button
                            key={iconName}
                            type="button"
                            onClick={() => setCollectionIcon(iconName)}
                            className={`w-8 h-8 rounded-lg transition-all flex items-center justify-center ${
                              collectionIcon === iconName
                                ? 'bg-teal-500/30 ring-2 ring-teal-500'
                                : 'bg-slate-700 hover:bg-slate-600'
                            }`}
                          >
                            <IconComp style={{ fontSize: 18, color: collectionColor }} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetCollectionForm}
                    className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createCollection.isPending || updateCollection.isPending}
                    className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors flex items-center gap-2"
                  >
                    {(createCollection.isPending || updateCollection.isPending) && (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {editingCollection ? 'Save Changes' : 'Add Collection'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Collections List */}
          {collectionsLoading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <MuiIcons.Collections style={{ fontSize: 64 }} className="opacity-30 mb-4" />
              <p className="text-lg">No collections yet. Create one to organize your quotes!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => {
                const IconComp = getIconComponent(collection.icon || 'Collections');
                return (
                  <div
                    key={collection.id}
                    className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${collection.color}20` }}
                        >
                          <IconComp style={{ fontSize: 24, color: collection.color }} />
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{collection.name}</h4>
                          <p className="text-sm text-slate-400">
                            {collection.quoteCount || 0} quote{collection.quoteCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditCollectionForm(collection)}
                          className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <MuiIcons.Edit style={{ fontSize: 16 }} />
                        </button>
                        <button
                          onClick={() => handleDeleteCollection(collection)}
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <MuiIcons.Delete style={{ fontSize: 16 }} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ManageQuotes;
