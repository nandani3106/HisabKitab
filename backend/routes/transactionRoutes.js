import express from 'express';
import {
  createTransaction,
  getBlockTransactions,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactionController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// Routes mapping
router.post('/', createTransaction);
router.get('/block/:blockId', getBlockTransactions);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

export default router;
