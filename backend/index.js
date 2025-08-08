import express from 'express';
import cors from 'cors';
import pool from './db.js';
import authRouter from './routes/auth.js';
import tasksRouter from './routes/tasks.js';
import projectsRouter from './routes/projects.js';
import profilesRouter from './routes/profiles.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('To-Do Backend API is running');
});

app.use('/auth', authRouter);
app.use('/tasks', tasksRouter);
app.use('/projects', projectsRouter);
app.use('/profiles', profilesRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 