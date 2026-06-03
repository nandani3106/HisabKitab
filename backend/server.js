import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import blockRoutes from './routes/blockRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import totalRoutes from './routes/totalRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/totals', totalRoutes);
app.use('/api/history', historyRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
