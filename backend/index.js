import express from 'express';
import cors from 'cors';
import pool from './db.js';
import runMigrations from './migrate.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import projectsRouter from './routes/projects.js';
import profilesRouter from './routes/profiles.js';
import aiRouter from './routes/ai.js';
import aiAnalyticsRouter from './routes/ai_analytics.js';
import scheduleDaily from './jobs/aggregate_ai_usage.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Run migrations on startup (non-blocking best effort)
runMigrations(pool).catch((e) => console.error('Migration error:', e));
// Fire-and-forget daily aggregation for yesterday (safe no-op if no data)
scheduleDaily().catch((e) => console.error('Aggregation error:', e));

app.get('/', (req, res) => {
  res.send('To-Do Backend API is running');
});

app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);
app.use('/projects', projectsRouter);
app.use('/profiles', profilesRouter);
app.use('/ai', aiRouter);
app.use('/ai/analytics', aiAnalyticsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 