// Load environment variables BEFORE any other imports
// Using 'dotenv/config' ensures env vars are loaded during import phase
import 'dotenv/config';

// Initialize Sentry BEFORE other imports for proper instrumentation
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,

  // Capture IP addresses and user info for better debugging
  sendDefaultPii: true,

  // Only enable when DSN is configured
  enabled: !!process.env.SENTRY_DSN,
});

import express from 'express';
import cors from 'cors';
import path from 'path';

import habitsRouter from './routes/habits';
import categoriesRouter from './routes/categories';
import tasksRouter from './routes/tasks';
import projectsRouter from './routes/projects';
import tagsRouter from './routes/tags';
import timeBlocksRouter from './routes/timeBlocks';
import measurementsRouter from './routes/measurements';
import parkingLotRouter from './routes/parkingLot';
import settingsRouter from './routes/settings';
import dashboardRouter from './routes/dashboard';
import quotesRouter from './routes/quotes';
import videosRouter from './routes/videos';

const app = express();
const PORT = parseInt(process.env.PORT || '3451', 10);

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/habits', habitsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/time-blocks', timeBlocksRouter);
app.use('/api/measurements', measurementsRouter);
app.use('/api/parking-lot', parkingLotRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/videos', videosRouter);

// Serve static files from client dist
const clientDistPath = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDistPath, {
  // Cache JS/CSS files with hashed names for 1 year
  // But don't cache HTML files
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (filePath.match(/\.(js|css|woff2?)$/)) {
      // Vite uses content hashes in filenames, safe to cache for long time
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
}));

// SPA fallback - serve index.html for all non-API routes
// Add no-cache headers to ensure browsers always get fresh HTML
app.use((req, res, next) => {
  if (req.path.startsWith('/api') || req.method !== 'GET') {
    return next();
  }
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// Sentry error handler - must be before other error handlers
Sentry.setupExpressErrorHandler(app);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`HabitArcade running on http://0.0.0.0:${PORT}`);
});
