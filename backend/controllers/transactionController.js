import Transaction from '../models/Transaction.js';
import Block from '../models/Block.js';

// @desc    Create new Transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { blockId, amount, description, date, mode } = req.body;

    if (!blockId || amount === undefined || !description || !date || !mode) {
      return res.status(400).json({ message: 'Please fill in all fields' });
    }

    // Verify block exists and belongs to logged-in user
    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    if (block.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to add transactions to this block' });
    }

    const transaction = await Transaction.create({
      userId: req.user._id,
      blockId,
      amount: Number(amount),
      description,
      date,
      mode,
    });

    return res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all Transactions for a specific block
// @route   GET /api/transactions/block/:blockId
// @access  Private
export const getBlockTransactions = async (req, res) => {
  try {
    const { blockId } = req.params;

    // Verify block exists and belongs to logged-in user
    const block = await Block.findById(blockId);
    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    if (block.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view transactions for this block' });
    }

    const transactions = await Transaction.find({ blockId });

    return res.status(200).json({
      success: true,
      transactions,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update a transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this transaction' });
    }

    const { amount, description, date, mode } = req.body;

    if (amount !== undefined) transaction.amount = Number(amount);
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;
    if (mode !== undefined) transaction.mode = mode;

    await transaction.save();

    return res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      transaction,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete a transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Check ownership
    if (transaction.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this transaction' });
    }

    await transaction.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};
