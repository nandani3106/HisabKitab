import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';

// @desc    Get current month's totals for all blocks belonging to the authenticated user
// @route   GET /api/totals/monthly
// @access  Private
export const getMonthlyTotals = async (req, res) => {
  try {
    // 1. Get all blocks belonging to the user
    const blocks = await Block.find({ userId: req.user._id });
    
    if (blocks.length === 0) {
      return res.status(200).json({
        blocks: [],
        grandOnlineTotal: 0,
        grandOfflineTotal: 0,
        grandTotal: 0,
      });
    }

    const blockIds = blocks.map((b) => b._id);

    // 2. Define current month date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 3. Find current month transactions
    const transactions = await Transaction.find({
      blockId: { $in: blockIds },
      date: { $gte: startOfMonth, $lt: nextMonth },
    });

    // 4. Map blocks and calculate individual block totals
    const blockTotals = blocks.map((block) => {
      const blockTxs = transactions.filter(
        (t) => t.blockId.toString() === block._id.toString()
      );

      const onlineTotal = blockTxs
        .filter((t) => t.mode === 'online')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const offlineTotal = blockTxs
        .filter((t) => t.mode === 'offline')
        .reduce((sum, t) => sum + Number(t.amount || 0), 0);

      const blockTotal = onlineTotal + offlineTotal;

      return {
        blockId: block._id,
        blockName: block.name,
        onlineTotal,
        offlineTotal,
        blockTotal,
      };
    });

    // 5. Calculate grand totals
    const grandOnlineTotal = blockTotals.reduce((sum, b) => sum + b.onlineTotal, 0);
    const grandOfflineTotal = blockTotals.reduce((sum, b) => sum + b.offlineTotal, 0);
    const grandTotal = grandOnlineTotal + grandOfflineTotal;

    return res.status(200).json({
      blocks: blockTotals,
      grandOnlineTotal,
      grandOfflineTotal,
      grandTotal,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get current month's totals for a single block
// @route   GET /api/totals/block/:blockId
// @access  Private
export const getBlockTotals = async (req, res) => {
  try {
    const { blockId } = req.params;

    // 1. Find block
    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // 2. Verify ownership
    if (block.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view totals for this block' });
    }

    // 3. Define current month date boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // 4. Find current month transactions
    const transactions = await Transaction.find({
      blockId: block._id,
      date: { $gte: startOfMonth, $lt: nextMonth },
    });

    // 5. Calculate totals
    const onlineTotal = transactions
      .filter((t) => t.mode === 'online')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const offlineTotal = transactions
      .filter((t) => t.mode === 'offline')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const blockTotal = onlineTotal + offlineTotal;

    return res.status(200).json({
      blockName: block.name,
      onlineTotal,
      offlineTotal,
      blockTotal,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};
