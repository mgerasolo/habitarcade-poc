/**
 * Icon definitions for the IconBrowser component
 * Curated list of Material Icons and Font Awesome icons for habit tracking
 */

export interface IconDefinition {
  name: string;
  provider: 'material' | 'fontawesome';
  class: string;
  keywords: string[];
}

// Material Icons - Popular icons for habit tracking
export const MATERIAL_ICONS: IconDefinition[] = [
  // Home & General
  { name: 'Home', provider: 'material', class: 'Home', keywords: ['home', 'house', 'living'] },
  { name: 'Star', provider: 'material', class: 'Star', keywords: ['star', 'favorite', 'important'] },
  { name: 'Check', provider: 'material', class: 'Check', keywords: ['check', 'done', 'complete', 'finished'] },
  { name: 'Check Circle', provider: 'material', class: 'CheckCircle', keywords: ['check', 'done', 'complete', 'success'] },

  // Health & Fitness
  { name: 'Fitness', provider: 'material', class: 'FitnessCenter', keywords: ['fitness', 'gym', 'exercise', 'workout'] },
  { name: 'Health', provider: 'material', class: 'Favorite', keywords: ['health', 'heart', 'love', 'wellness'] },
  { name: 'Self Care', provider: 'material', class: 'SelfImprovement', keywords: ['meditation', 'yoga', 'mindfulness', 'calm'] },
  { name: 'Accessibility', provider: 'material', class: 'AccessibilityNew', keywords: ['body', 'stretch', 'exercise'] },
  { name: 'Healing', provider: 'material', class: 'Healing', keywords: ['health', 'medical', 'recovery'] },
  { name: 'Bedtime', provider: 'material', class: 'Bedtime', keywords: ['sleep', 'rest', 'night', 'moon'] },

  // Learning & Productivity
  { name: 'Book', provider: 'material', class: 'MenuBook', keywords: ['book', 'read', 'study', 'learn'] },
  { name: 'Code', provider: 'material', class: 'Code', keywords: ['code', 'programming', 'dev', 'developer'] },
  { name: 'Work', provider: 'material', class: 'Work', keywords: ['work', 'job', 'briefcase', 'business'] },
  { name: 'School', provider: 'material', class: 'School', keywords: ['school', 'education', 'graduate', 'learn'] },
  { name: 'Lightbulb', provider: 'material', class: 'Lightbulb', keywords: ['idea', 'lightbulb', 'creative', 'innovation'] },
  { name: 'Laptop', provider: 'material', class: 'LaptopMac', keywords: ['laptop', 'computer', 'work', 'tech'] },
  { name: 'Create', provider: 'material', class: 'Create', keywords: ['create', 'write', 'edit', 'pencil'] },
  { name: 'Article', provider: 'material', class: 'Article', keywords: ['article', 'blog', 'write', 'document'] },

  // Finance & Money
  { name: 'Money', provider: 'material', class: 'AttachMoney', keywords: ['money', 'finance', 'dollar', 'savings'] },
  { name: 'Savings', provider: 'material', class: 'Savings', keywords: ['savings', 'piggy', 'bank', 'money'] },
  { name: 'Account Balance', provider: 'material', class: 'AccountBalance', keywords: ['bank', 'finance', 'money'] },
  { name: 'Paid', provider: 'material', class: 'Paid', keywords: ['paid', 'money', 'payment'] },

  // Time & Planning
  { name: 'Calendar', provider: 'material', class: 'CalendarMonth', keywords: ['calendar', 'date', 'schedule', 'plan'] },
  { name: 'Timer', provider: 'material', class: 'Timer', keywords: ['timer', 'clock', 'time', 'stopwatch'] },
  { name: 'Alarm', provider: 'material', class: 'Alarm', keywords: ['alarm', 'wake', 'time', 'reminder'] },
  { name: 'Schedule', provider: 'material', class: 'Schedule', keywords: ['schedule', 'clock', 'time'] },
  { name: 'Event', provider: 'material', class: 'Event', keywords: ['event', 'calendar', 'date'] },

  // Goals & Achievement
  { name: 'Target', provider: 'material', class: 'TrackChanges', keywords: ['target', 'goal', 'aim', 'focus'] },
  { name: 'Flag', provider: 'material', class: 'Flag', keywords: ['flag', 'milestone', 'goal'] },
  { name: 'Trending Up', provider: 'material', class: 'TrendingUp', keywords: ['trending', 'growth', 'progress', 'up'] },
  { name: 'Leaderboard', provider: 'material', class: 'Leaderboard', keywords: ['leaderboard', 'ranking', 'score'] },
  { name: 'Emoji Events', provider: 'material', class: 'EmojiEvents', keywords: ['trophy', 'award', 'win', 'achievement'] },
  { name: 'Military Tech', provider: 'material', class: 'MilitaryTech', keywords: ['medal', 'award', 'achievement'] },

  // Social & People
  { name: 'Person', provider: 'material', class: 'Person', keywords: ['person', 'user', 'profile', 'individual'] },
  { name: 'Group', provider: 'material', class: 'Group', keywords: ['group', 'team', 'people', 'community'] },
  { name: 'Family', provider: 'material', class: 'FamilyRestroom', keywords: ['family', 'people', 'home'] },
  { name: 'Diversity', provider: 'material', class: 'Diversity3', keywords: ['diversity', 'group', 'team'] },

  // Hobbies & Entertainment
  { name: 'Music', provider: 'material', class: 'MusicNote', keywords: ['music', 'note', 'audio', 'sound'] },
  { name: 'Camera', provider: 'material', class: 'CameraAlt', keywords: ['camera', 'photo', 'picture', 'photography'] },
  { name: 'Palette', provider: 'material', class: 'Palette', keywords: ['art', 'paint', 'creative', 'design'] },
  { name: 'Brush', provider: 'material', class: 'Brush', keywords: ['paint', 'art', 'brush', 'creative'] },
  { name: 'Sports Soccer', provider: 'material', class: 'SportsSoccer', keywords: ['soccer', 'sports', 'football'] },
  { name: 'Sports Basketball', provider: 'material', class: 'SportsBasketball', keywords: ['basketball', 'sports'] },
  { name: 'Pool', provider: 'material', class: 'Pool', keywords: ['swim', 'pool', 'water', 'exercise'] },
  { name: 'Hiking', provider: 'material', class: 'Hiking', keywords: ['hiking', 'walk', 'outdoor', 'nature'] },
  { name: 'Pets', provider: 'material', class: 'Pets', keywords: ['pets', 'animal', 'dog', 'cat'] },
  { name: 'Gamepad', provider: 'material', class: 'SportsEsports', keywords: ['game', 'gaming', 'controller'] },

  // Food & Drink
  { name: 'Food', provider: 'material', class: 'Restaurant', keywords: ['food', 'restaurant', 'eat', 'dining'] },
  { name: 'Coffee', provider: 'material', class: 'LocalCafe', keywords: ['coffee', 'cafe', 'drink', 'morning'] },
  { name: 'Water', provider: 'material', class: 'WaterDrop', keywords: ['water', 'drink', 'hydration'] },
  { name: 'Apple', provider: 'material', class: 'Apple', keywords: ['apple', 'fruit', 'healthy', 'nutrition'] },
  { name: 'Kitchen', provider: 'material', class: 'Kitchen', keywords: ['cook', 'kitchen', 'food', 'meal'] },

  // Shopping & Life
  { name: 'Shopping', provider: 'material', class: 'ShoppingCart', keywords: ['shopping', 'cart', 'buy', 'store'] },
  { name: 'Shopping Bag', provider: 'material', class: 'ShoppingBag', keywords: ['shopping', 'bag', 'buy'] },
  { name: 'Cleaning', provider: 'material', class: 'CleaningServices', keywords: ['clean', 'cleaning', 'tidy'] },

  // Misc
  { name: 'Settings', provider: 'material', class: 'Settings', keywords: ['settings', 'config', 'gear', 'preferences'] },
  { name: 'Bolt', provider: 'material', class: 'Bolt', keywords: ['bolt', 'energy', 'fast', 'lightning'] },
  { name: 'Rocket', provider: 'material', class: 'RocketLaunch', keywords: ['rocket', 'launch', 'fast', 'startup'] },
  { name: 'Nature', provider: 'material', class: 'Nature', keywords: ['nature', 'tree', 'plant', 'environment'] },
  { name: 'Eco', provider: 'material', class: 'Eco', keywords: ['eco', 'leaf', 'green', 'environment'] },
  { name: 'Volunteer', provider: 'material', class: 'VolunteerActivism', keywords: ['volunteer', 'help', 'charity', 'heart'] },
  { name: 'Celebration', provider: 'material', class: 'Celebration', keywords: ['celebrate', 'party', 'fun'] },
  { name: 'Psychology', provider: 'material', class: 'Psychology', keywords: ['brain', 'mind', 'mental', 'think'] },
];

// Font Awesome icons - Additional icons for variety
export const FONTAWESOME_ICONS: IconDefinition[] = [
  // Health & Fitness
  { name: 'Dumbbell', provider: 'fontawesome', class: 'fa-solid fa-dumbbell', keywords: ['gym', 'fitness', 'exercise', 'workout'] },
  { name: 'Heart Pulse', provider: 'fontawesome', class: 'fa-solid fa-heart-pulse', keywords: ['health', 'heartbeat', 'cardio'] },
  { name: 'Running', provider: 'fontawesome', class: 'fa-solid fa-person-running', keywords: ['running', 'exercise', 'cardio', 'jog'] },
  { name: 'Walking', provider: 'fontawesome', class: 'fa-solid fa-person-walking', keywords: ['walking', 'exercise', 'steps'] },
  { name: 'Biking', provider: 'fontawesome', class: 'fa-solid fa-person-biking', keywords: ['biking', 'cycling', 'exercise'] },
  { name: 'Swimming', provider: 'fontawesome', class: 'fa-solid fa-person-swimming', keywords: ['swimming', 'pool', 'exercise'] },
  { name: 'Yoga', provider: 'fontawesome', class: 'fa-solid fa-spa', keywords: ['meditation', 'spa', 'relax', 'yoga'] },

  // Mind & Mental
  { name: 'Brain', provider: 'fontawesome', class: 'fa-solid fa-brain', keywords: ['brain', 'think', 'mental', 'mind'] },
  { name: 'Heart', provider: 'fontawesome', class: 'fa-solid fa-heart', keywords: ['heart', 'love', 'health', 'wellness'] },
  { name: 'Face Smile', provider: 'fontawesome', class: 'fa-solid fa-face-smile', keywords: ['smile', 'happy', 'mood', 'emotion'] },
  { name: 'Comments', provider: 'fontawesome', class: 'fa-solid fa-comments', keywords: ['chat', 'talk', 'social', 'communication'] },

  // Achievement & Gaming
  { name: 'Trophy', provider: 'fontawesome', class: 'fa-solid fa-trophy', keywords: ['trophy', 'win', 'achievement', 'award'] },
  { name: 'Medal', provider: 'fontawesome', class: 'fa-solid fa-medal', keywords: ['medal', 'achievement', 'award'] },
  { name: 'Crown', provider: 'fontawesome', class: 'fa-solid fa-crown', keywords: ['crown', 'king', 'winner', 'best'] },
  { name: 'Fire', provider: 'fontawesome', class: 'fa-solid fa-fire', keywords: ['fire', 'streak', 'hot', 'burning'] },
  { name: 'Bolt', provider: 'fontawesome', class: 'fa-solid fa-bolt', keywords: ['bolt', 'energy', 'power', 'lightning'] },
  { name: 'Gem', provider: 'fontawesome', class: 'fa-solid fa-gem', keywords: ['gem', 'diamond', 'valuable', 'reward'] },
  { name: 'Star', provider: 'fontawesome', class: 'fa-solid fa-star', keywords: ['star', 'favorite', 'rating'] },
  { name: 'Dice', provider: 'fontawesome', class: 'fa-solid fa-dice', keywords: ['dice', 'game', 'random', 'play'] },
  { name: 'Gamepad', provider: 'fontawesome', class: 'fa-solid fa-gamepad', keywords: ['game', 'gaming', 'play', 'controller'] },
  { name: 'Puzzle', provider: 'fontawesome', class: 'fa-solid fa-puzzle-piece', keywords: ['puzzle', 'game', 'solve'] },

  // Time & Planning
  { name: 'Clock', provider: 'fontawesome', class: 'fa-solid fa-clock', keywords: ['clock', 'time', 'schedule'] },
  { name: 'Hourglass', provider: 'fontawesome', class: 'fa-solid fa-hourglass-half', keywords: ['hourglass', 'time', 'wait'] },
  { name: 'Calendar Days', provider: 'fontawesome', class: 'fa-solid fa-calendar-days', keywords: ['calendar', 'date', 'schedule'] },
  { name: 'Calendar Check', provider: 'fontawesome', class: 'fa-solid fa-calendar-check', keywords: ['calendar', 'done', 'scheduled'] },
  { name: 'Bell', provider: 'fontawesome', class: 'fa-solid fa-bell', keywords: ['bell', 'notification', 'reminder'] },

  // Productivity & Work
  { name: 'Rocket', provider: 'fontawesome', class: 'fa-solid fa-rocket', keywords: ['rocket', 'launch', 'fast', 'startup'] },
  { name: 'Bullseye', provider: 'fontawesome', class: 'fa-solid fa-bullseye', keywords: ['target', 'goal', 'aim', 'focus'] },
  { name: 'Crosshairs', provider: 'fontawesome', class: 'fa-solid fa-crosshairs', keywords: ['focus', 'target', 'aim'] },
  { name: 'Check', provider: 'fontawesome', class: 'fa-solid fa-check', keywords: ['check', 'done', 'complete'] },
  { name: 'Check Double', provider: 'fontawesome', class: 'fa-solid fa-check-double', keywords: ['check', 'done', 'verified'] },
  { name: 'List Check', provider: 'fontawesome', class: 'fa-solid fa-list-check', keywords: ['list', 'tasks', 'todo', 'checklist'] },
  { name: 'Clipboard', provider: 'fontawesome', class: 'fa-solid fa-clipboard-list', keywords: ['clipboard', 'list', 'tasks'] },
  { name: 'Folder', provider: 'fontawesome', class: 'fa-solid fa-folder', keywords: ['folder', 'project', 'organize'] },
  { name: 'Laptop', provider: 'fontawesome', class: 'fa-solid fa-laptop-code', keywords: ['laptop', 'code', 'programming'] },
  { name: 'Briefcase', provider: 'fontawesome', class: 'fa-solid fa-briefcase', keywords: ['work', 'business', 'job'] },

  // Food & Drink
  { name: 'Coffee', provider: 'fontawesome', class: 'fa-solid fa-mug-hot', keywords: ['coffee', 'drink', 'morning', 'hot'] },
  { name: 'Apple', provider: 'fontawesome', class: 'fa-solid fa-apple-whole', keywords: ['apple', 'fruit', 'healthy'] },
  { name: 'Utensils', provider: 'fontawesome', class: 'fa-solid fa-utensils', keywords: ['food', 'eat', 'dining'] },
  { name: 'Glass Water', provider: 'fontawesome', class: 'fa-solid fa-glass-water', keywords: ['water', 'drink', 'hydration'] },
  { name: 'Bottle Water', provider: 'fontawesome', class: 'fa-solid fa-bottle-water', keywords: ['water', 'drink', 'hydration'] },
  { name: 'Carrot', provider: 'fontawesome', class: 'fa-solid fa-carrot', keywords: ['carrot', 'vegetable', 'healthy'] },

  // Rest & Sleep
  { name: 'Bed', provider: 'fontawesome', class: 'fa-solid fa-bed', keywords: ['bed', 'sleep', 'rest', 'night'] },
  { name: 'Moon', provider: 'fontawesome', class: 'fa-solid fa-moon', keywords: ['moon', 'night', 'sleep'] },
  { name: 'Sun', provider: 'fontawesome', class: 'fa-solid fa-sun', keywords: ['sun', 'morning', 'day', 'bright'] },
  { name: 'Couch', provider: 'fontawesome', class: 'fa-solid fa-couch', keywords: ['couch', 'relax', 'rest'] },

  // Learning
  { name: 'Book', provider: 'fontawesome', class: 'fa-solid fa-book', keywords: ['book', 'read', 'study', 'learn'] },
  { name: 'Book Open', provider: 'fontawesome', class: 'fa-solid fa-book-open', keywords: ['book', 'read', 'study'] },
  { name: 'Graduation Cap', provider: 'fontawesome', class: 'fa-solid fa-graduation-cap', keywords: ['graduation', 'education', 'school'] },
  { name: 'Pen', provider: 'fontawesome', class: 'fa-solid fa-pen', keywords: ['pen', 'write', 'journal'] },
  { name: 'Pencil', provider: 'fontawesome', class: 'fa-solid fa-pencil', keywords: ['pencil', 'write', 'draw'] },
  { name: 'Language', provider: 'fontawesome', class: 'fa-solid fa-language', keywords: ['language', 'learn', 'translate'] },

  // Finance
  { name: 'Dollar', provider: 'fontawesome', class: 'fa-solid fa-dollar-sign', keywords: ['dollar', 'money', 'finance'] },
  { name: 'Piggy Bank', provider: 'fontawesome', class: 'fa-solid fa-piggy-bank', keywords: ['savings', 'money', 'bank'] },
  { name: 'Wallet', provider: 'fontawesome', class: 'fa-solid fa-wallet', keywords: ['wallet', 'money', 'payment'] },
  { name: 'Chart Line', provider: 'fontawesome', class: 'fa-solid fa-chart-line', keywords: ['chart', 'graph', 'growth', 'progress'] },

  // Misc
  { name: 'Guitar', provider: 'fontawesome', class: 'fa-solid fa-guitar', keywords: ['guitar', 'music', 'instrument'] },
  { name: 'Headphones', provider: 'fontawesome', class: 'fa-solid fa-headphones', keywords: ['headphones', 'music', 'audio'] },
  { name: 'Camera', provider: 'fontawesome', class: 'fa-solid fa-camera', keywords: ['camera', 'photo', 'picture'] },
  { name: 'Paintbrush', provider: 'fontawesome', class: 'fa-solid fa-paintbrush', keywords: ['paint', 'art', 'creative'] },
  { name: 'Seedling', provider: 'fontawesome', class: 'fa-solid fa-seedling', keywords: ['plant', 'grow', 'nature', 'garden'] },
  { name: 'Leaf', provider: 'fontawesome', class: 'fa-solid fa-leaf', keywords: ['leaf', 'nature', 'eco', 'green'] },
  { name: 'Tree', provider: 'fontawesome', class: 'fa-solid fa-tree', keywords: ['tree', 'nature', 'environment'] },
  { name: 'Mountain', provider: 'fontawesome', class: 'fa-solid fa-mountain', keywords: ['mountain', 'hiking', 'outdoor'] },
  { name: 'Dog', provider: 'fontawesome', class: 'fa-solid fa-dog', keywords: ['dog', 'pet', 'animal'] },
  { name: 'Cat', provider: 'fontawesome', class: 'fa-solid fa-cat', keywords: ['cat', 'pet', 'animal'] },
  { name: 'Broom', provider: 'fontawesome', class: 'fa-solid fa-broom', keywords: ['clean', 'broom', 'tidy'] },
  { name: 'House', provider: 'fontawesome', class: 'fa-solid fa-house', keywords: ['house', 'home', 'living'] },
  { name: 'Car', provider: 'fontawesome', class: 'fa-solid fa-car', keywords: ['car', 'drive', 'commute'] },
  { name: 'Plane', provider: 'fontawesome', class: 'fa-solid fa-plane', keywords: ['plane', 'travel', 'flight'] },
  { name: 'Hands Praying', provider: 'fontawesome', class: 'fa-solid fa-hands-praying', keywords: ['pray', 'spiritual', 'meditation'] },
  { name: 'Cross', provider: 'fontawesome', class: 'fa-solid fa-cross', keywords: ['cross', 'spiritual', 'faith'] },
  { name: 'Yin Yang', provider: 'fontawesome', class: 'fa-solid fa-yin-yang', keywords: ['balance', 'zen', 'harmony'] },
  { name: 'Infinity', provider: 'fontawesome', class: 'fa-solid fa-infinity', keywords: ['infinity', 'forever', 'endless'] },
];

// All icons combined
export const ALL_ICONS = [...MATERIAL_ICONS, ...FONTAWESOME_ICONS];

// Color palette for icons - curated for habit tracking
export const ICON_COLORS = [
  '#ef4444', // red - urgency, health
  '#f97316', // orange - energy, creativity
  '#fbbf24', // amber - attention, warning
  '#84cc16', // lime - growth, fresh
  '#22c55e', // green - success, health
  '#14b8a6', // teal - balance, calm (default)
  '#06b6d4', // cyan - clarity, focus
  '#3b82f6', // blue - trust, productivity
  '#6366f1', // indigo - wisdom, depth
  '#8b5cf6', // violet - creativity, luxury
  '#a855f7', // purple - imagination, spiritual
  '#ec4899', // pink - love, care
  '#f43f5e', // rose - passion, romance
  '#6b7280', // gray - neutral, professional
  '#ffffff', // white - clean, minimal
];

// Default color for new icons
export const DEFAULT_ICON_COLOR = '#14b8a6'; // teal
