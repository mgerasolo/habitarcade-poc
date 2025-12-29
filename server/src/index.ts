// Load environment variables BEFORE any other imports
// Using 'dotenv/config' ensures env vars are loaded during import phase
import 'dotenv/config';

import express from 'express';
import cors from 'cors';

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

const app = express();
const PORT = process.env.PORT || 3451;

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

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error', code: 'INTERNAL_ERROR' });
});

app.listen(PORT, () => {
  console.log(`HabitArcade API running on port ${PORT}`);
});
