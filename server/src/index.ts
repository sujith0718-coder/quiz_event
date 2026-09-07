import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { initSocketServer } from './services/socket.js';
import { User } from './models/User.js';
import { Event } from './models/Event.js';
import { seedQuestionsIfEmpty } from './controllers/questionController.js';

import authRoutes from './routes/authRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import hintRoutes from './routes/hintRoutes.js';

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// CORS & Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Initialize Socket.IO
initSocketServer(httpServer, CLIENT_URL);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/questions', hintRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Quiz Competition Engine', timestamp: new Date() });
});

// Auto-seed admin user & initial event
const seedDefaultData = async () => {
  try {
    const adminCount = await User.countDocuments({ role: 'ADMIN' });
    if (adminCount === 0) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'System Administrator',
        email: 'admin@quiz.com',
        passwordHash,
        role: 'ADMIN',
      });
      console.log('[Seed] Created default admin user: admin@quiz.com / admin123');
    }

    let event = await Event.findOne();
    if (!event) {
      event = await Event.create({
        name: 'Software Engineering & Systems Quiz 2026',
        description: 'Real-Time competition covering Data Structures, System Design, and Algorithmic Riddles.',
        status: 'LIVE',
        isFrozen: false,
      });
      console.log('[Seed] Created initial competition event:', event.name);
    }

    if (event) {
      await seedQuestionsIfEmpty(event._id.toString());
    }
  } catch (err) {
    console.error('[Seed] Error seeding default data:', err);
  }
};

// Start Server
const startServer = async () => {
  await connectDB();
  await seedDefaultData();

  httpServer.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(` 🚀 Quiz Platform API Server running on port ${PORT}`);
    console.log(` 🌐 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
};

startServer();
