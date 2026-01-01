/**
 * Motivational and inspirational quotes data
 *
 * Categories:
 * - motivation: General motivation and drive
 * - habits: Habit formation and consistency
 * - productivity: Focus and getting things done
 * - growth: Personal growth and self-improvement
 * - mindfulness: Present moment awareness
 * - perseverance: Overcoming challenges
 */

export interface Quote {
  id: string;
  text: string;
  author: string;
  category: QuoteCategory;
}

export type QuoteCategory =
  | 'motivation'
  | 'habits'
  | 'productivity'
  | 'growth'
  | 'mindfulness'
  | 'perseverance';

export const QUOTE_CATEGORIES: Record<QuoteCategory, { label: string; color: string }> = {
  motivation: { label: 'Motivation', color: 'text-amber-400' },
  habits: { label: 'Habits', color: 'text-teal-400' },
  productivity: { label: 'Productivity', color: 'text-blue-400' },
  growth: { label: 'Growth', color: 'text-purple-400' },
  mindfulness: { label: 'Mindfulness', color: 'text-green-400' },
  perseverance: { label: 'Perseverance', color: 'text-rose-400' },
};

export const QUOTES: Quote[] = [
  // Motivation
  {
    id: 'mot-1',
    text: 'The only way to do great work is to love what you do.',
    author: 'Steve Jobs',
    category: 'motivation',
  },
  {
    id: 'mot-2',
    text: 'It does not matter how slowly you go as long as you do not stop.',
    author: 'Confucius',
    category: 'motivation',
  },
  {
    id: 'mot-3',
    text: 'Believe you can and you\'re halfway there.',
    author: 'Theodore Roosevelt',
    category: 'motivation',
  },
  {
    id: 'mot-4',
    text: 'The future belongs to those who believe in the beauty of their dreams.',
    author: 'Eleanor Roosevelt',
    category: 'motivation',
  },
  {
    id: 'mot-5',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'motivation',
  },

  // Habits
  {
    id: 'hab-1',
    text: 'We are what we repeatedly do. Excellence, then, is not an act, but a habit.',
    author: 'Aristotle',
    category: 'habits',
  },
  {
    id: 'hab-2',
    text: 'Habits are the compound interest of self-improvement.',
    author: 'James Clear',
    category: 'habits',
  },
  {
    id: 'hab-3',
    text: 'Small habits don\'t add up. They compound.',
    author: 'James Clear',
    category: 'habits',
  },
  {
    id: 'hab-4',
    text: 'The chains of habit are too light to be felt until they are too heavy to be broken.',
    author: 'Warren Buffett',
    category: 'habits',
  },
  {
    id: 'hab-5',
    text: 'Every action you take is a vote for the type of person you wish to become.',
    author: 'James Clear',
    category: 'habits',
  },
  {
    id: 'hab-6',
    text: 'You do not rise to the level of your goals. You fall to the level of your systems.',
    author: 'James Clear',
    category: 'habits',
  },
  {
    id: 'hab-7',
    text: 'Motivation is what gets you started. Habit is what keeps you going.',
    author: 'Jim Ryun',
    category: 'habits',
  },

  // Productivity
  {
    id: 'prod-1',
    text: 'Focus on being productive instead of busy.',
    author: 'Tim Ferriss',
    category: 'productivity',
  },
  {
    id: 'prod-2',
    text: 'The key is not to prioritize what\'s on your schedule, but to schedule your priorities.',
    author: 'Stephen Covey',
    category: 'productivity',
  },
  {
    id: 'prod-3',
    text: 'You can do anything, but not everything.',
    author: 'David Allen',
    category: 'productivity',
  },
  {
    id: 'prod-4',
    text: 'Until we can manage time, we can manage nothing else.',
    author: 'Peter Drucker',
    category: 'productivity',
  },
  {
    id: 'prod-5',
    text: 'Your mind is for having ideas, not holding them.',
    author: 'David Allen',
    category: 'productivity',
  },

  // Growth
  {
    id: 'grow-1',
    text: 'The only person you are destined to become is the person you decide to be.',
    author: 'Ralph Waldo Emerson',
    category: 'growth',
  },
  {
    id: 'grow-2',
    text: 'Growth is painful. Change is painful. But nothing is as painful as staying stuck.',
    author: 'Mandy Hale',
    category: 'growth',
  },
  {
    id: 'grow-3',
    text: 'What we fear doing most is usually what we most need to do.',
    author: 'Tim Ferriss',
    category: 'growth',
  },
  {
    id: 'grow-4',
    text: 'Be not afraid of growing slowly, be afraid only of standing still.',
    author: 'Chinese Proverb',
    category: 'growth',
  },
  {
    id: 'grow-5',
    text: 'The comfort zone is a beautiful place, but nothing ever grows there.',
    author: 'Unknown',
    category: 'growth',
  },

  // Mindfulness
  {
    id: 'mind-1',
    text: 'The present moment is filled with joy and happiness. If you are attentive, you will see it.',
    author: 'Thich Nhat Hanh',
    category: 'mindfulness',
  },
  {
    id: 'mind-2',
    text: 'Almost everything will work again if you unplug it for a few minutes, including you.',
    author: 'Anne Lamott',
    category: 'mindfulness',
  },
  {
    id: 'mind-3',
    text: 'The mind is everything. What you think you become.',
    author: 'Buddha',
    category: 'mindfulness',
  },
  {
    id: 'mind-4',
    text: 'In today\'s rush, we all think too much, seek too much, want too much, and forget about the joy of just being.',
    author: 'Eckhart Tolle',
    category: 'mindfulness',
  },
  {
    id: 'mind-5',
    text: 'Wherever you are, be all there.',
    author: 'Jim Elliot',
    category: 'mindfulness',
  },

  // Perseverance
  {
    id: 'pers-1',
    text: 'Fall seven times, stand up eight.',
    author: 'Japanese Proverb',
    category: 'perseverance',
  },
  {
    id: 'pers-2',
    text: 'It\'s not whether you get knocked down, it\'s whether you get up.',
    author: 'Vince Lombardi',
    category: 'perseverance',
  },
  {
    id: 'pers-3',
    text: 'Perseverance is not a long race; it is many short races one after the other.',
    author: 'Walter Elliot',
    category: 'perseverance',
  },
  {
    id: 'pers-4',
    text: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'perseverance',
  },
  {
    id: 'pers-5',
    text: 'Obstacles don\'t have to stop you. If you run into a wall, don\'t turn around and give up.',
    author: 'Michael Jordan',
    category: 'perseverance',
  },
];

/**
 * Get a quote for a specific date (deterministic selection)
 * Uses date as seed to ensure same quote appears for same date
 */
export function getQuoteOfTheDay(date: Date = new Date()): Quote {
  const dayOfYear = getDayOfYear(date);
  const year = date.getFullYear();
  // Combine day and year for more variation across years
  const seed = dayOfYear + year * 366;
  const index = seed % QUOTES.length;
  return QUOTES[index];
}

/**
 * Get day of year (1-366)
 */
function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

/**
 * Get a random quote
 */
export function getRandomQuote(): Quote {
  const index = Math.floor(Math.random() * QUOTES.length);
  return QUOTES[index];
}

/**
 * Get quotes by category
 */
export function getQuotesByCategory(category: QuoteCategory): Quote[] {
  return QUOTES.filter((q) => q.category === category);
}

/**
 * Search quotes by text or author
 */
export function searchQuotes(query: string): Quote[] {
  const lowerQuery = query.toLowerCase();
  return QUOTES.filter(
    (q) =>
      q.text.toLowerCase().includes(lowerQuery) ||
      q.author.toLowerCase().includes(lowerQuery)
  );
}

export default QUOTES;
