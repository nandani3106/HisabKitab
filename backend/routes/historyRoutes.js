import express from 'express';
import { getHistoryMonths, getHistoryByMonth } from '../controllers/historyController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// Routes mapping
router.get('/months', getHistoryMonths);
router.get('/:month', getHistoryByMonth);

export default router;
