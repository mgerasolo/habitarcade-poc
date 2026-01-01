import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'habitarcade-favorite-quotes';

/**
 * Hook to manage favorite quotes in localStorage
 */
export function useFavoriteQuotes() {
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return new Set(Array.isArray(parsed) ? parsed : []);
      }
    } catch {
      console.warn('Failed to load favorite quotes from localStorage');
    }
    return new Set();
  });

  // Persist to localStorage whenever favorites change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
    } catch {
      console.warn('Failed to save favorite quotes to localStorage');
    }
  }, [favorites]);

  const addFavorite = useCallback((quoteId: string) => {
    setFavorites((prev) => new Set([...prev, quoteId]));
  }, []);

  const removeFavorite = useCallback((quoteId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.delete(quoteId);
      return next;
    });
  }, []);

  const toggleFavorite = useCallback((quoteId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(quoteId)) {
        next.delete(quoteId);
      } else {
        next.add(quoteId);
      }
      return next;
    });
  }, []);

  const isFavorite = useCallback((quoteId: string) => favorites.has(quoteId), [favorites]);

  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
  }, []);

  return {
    favorites: [...favorites],
    favoritesSet: favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    count: favorites.size,
  };
}

export default useFavoriteQuotes;
