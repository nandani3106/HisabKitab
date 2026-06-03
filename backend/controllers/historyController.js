import mongoose from 'mongoose';
import Block from '../models/Block.js';
import Transaction from '../models/Transaction.js';

// @desc    Get all months that contain transactions for the logged-in user
// @route   GET /api/history/months
// @access  Private
export const getHistoryMonths = async (req, res) => {
  try {
    const userId = req.user._id;

    // Aggregate unique months in YYYY-MM format from transaction dates
    const aggregatedMonths = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      {
        $project: {
          yearMonth: {
            $dateToString: { format: '%Y-%m', date: '$date' },
          },
        },
      },
      { $group: { _id: '$yearMonth' } },
      { $sort: { _id: -1 } },
    ]);

    const monthsList = aggregatedMonths.map((item) => item._id);

    return res.status(200).json(monthsList);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get complete history details for a specific month
// @route   GET /api/history/:month
// @access  Private
export const getHistoryByMonth = async (req, res) => {
  try {
    const { month } = req.params;

    // Validate YYYY-MM format
    const monthRegex = /^\d{4}-\d{2}$/;
    if (!monthRegex.test(month)) {
      return res.status(400).json({ message: 'Invalid month format. Please use YYYY-MM.' });
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthIndex = parseInt(monthStr, 10) - 1; // 0-indexed in JS Dates

    const startOfMonth = new Date(year, monthIndex, 1);
    const nextMonth = new Date(year, monthIndex + 1, 1);

    // Fetch user blocks
    const blocks = await Block.find({ userId: req.user._id });
    if (blocks.length === 0) {
      return res.status(200).json({
        month,
        blocks: [],
        grandOnlineTotal: 0,
        grandOfflineTotal: 0,
        grandTotal: 0,
      });
    }

    const blockIds = blocks.map((b) => b._id);

    // Fetch transactions in date boundary
    const transactions = await Transaction.find({
      blockId: { $in: blockIds },
      date: { $gte: startOfMonth, $lt: nextMonth },
    }).sort({ date: -1 });

    // Group transactions block-wise and compute totals
    const blocksData = [];
    blocks.forEach((block) => {
      const blockTxs = transactions.filter(
        (t) => t.blockId.toString() === block._id.toString()
      );

      // We only include blocks that have transactions in this historical month
      if (blockTxs.length > 0) {
        const onlineTotal = blockTxs
          .filter((t) => t.mode === 'online')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const offlineTotal = blockTxs
          .filter((t) => t.mode === 'offline')
          .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        const blockTotal = onlineTotal + offlineTotal;

        blocksData.push({
          blockId: block._id,
          blockName: block.name,
          onlineTotal,
          offlineTotal,
          blockTotal,
          transactions: blockTxs.map((t) => ({
            id: t._id,
            date: t.date.toISOString().split('T')[0],
            description: t.description,
            amount: t.amount,
            mode: t.mode,
          })),
        });
      }
    });

    // Calculate grand totals for month
    const grandOnlineTotal = blocksData.reduce((sum, b) => sum + b.onlineTotal, 0);
    const grandOfflineTotal = blocksData.reduce((sum, b) => sum + b.offlineTotal, 0);
    const grandTotal = grandOnlineTotal + grandOfflineTotal;

    return res.status(200).json({
      month,
      blocks: blocksData,
      grandOnlineTotal,
      grandOfflineTotal,
      grandTotal,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};
