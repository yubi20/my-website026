import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabaseSchema, checkDbConnection } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import userRoutes from './routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/user', userRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'Banana Math Puzzle Game',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error.',
  });
});

// Startup sequence
const startServer = async () => {
  try {
    console.log('🍌 Connecting to MySQL Database...');
    await initDatabaseSchema().catch((err) => {
      console.warn('⚠️ Could not auto-initialize DB on startup:', err.message);
      console.warn('ℹ️ You can set MySQL credentials in backend/.env or run npm run db:init');
    });

    app.listen(PORT, () => {
      console.log(`🚀 Banana Game Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();
