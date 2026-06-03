import express from 'express';
import { getMonthlyTotals, getBlockTotals } from '../controllers/totalController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// Routes mapping
router.get('/monthly', getMonthlyTotals);
router.get('/block/:blockId', getBlockTotals);

export default router;
