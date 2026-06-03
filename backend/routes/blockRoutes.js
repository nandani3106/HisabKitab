import express from 'express';
import {
  createBlock,
  getUserBlocks,
  updateBlock,
  deleteBlock,
} from '../controllers/blockController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(protect);

// Routes mapping
router.post('/', createBlock);
router.get('/', getUserBlocks);
router.put('/:id', updateBlock);
router.delete('/:id', deleteBlock);

export default router;
