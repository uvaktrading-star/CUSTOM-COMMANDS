import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import commandRoutes from './commands.js';
import testApiRoutes from './test-api.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/test-api', testApiRoutes);
app.use('/api/commands', commandRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is running' });
});

// DB connect
connectDB().catch(err => console.error('DB Error:', err));

// 🔥 Vercel එකට export කරන්න
export default app;
