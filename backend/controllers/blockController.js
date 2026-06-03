import Block from '../models/Block.js';

// @desc    Create new Block
// @route   POST /api/blocks
// @access  Private
export const createBlock = async (req, res) => {
  try {
    const { name, mode, color, balance } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Block name is required' });
    }

    const block = await Block.create({
      userId: req.user._id,
      name,
      mode: mode || 'both',
      color: color || 'rosePink',
      balance: Number(balance) || 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Block created successfully',
      block,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Get all Blocks for logged-in user
// @route   GET /api/blocks
// @access  Private
export const getUserBlocks = async (req, res) => {
  try {
    const blocks = await Block.find({ userId: req.user._id });
    return res.status(200).json({
      success: true,
      blocks,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Update a block details
// @route   PUT /api/blocks/:id
// @access  Private
export const updateBlock = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Check ownership
    if (block.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this block' });
    }

    const { name, mode, color, balance } = req.body;

    if (name !== undefined) block.name = name;
    if (mode !== undefined) block.mode = mode;
    if (color !== undefined) block.color = color;
    if (balance !== undefined) block.balance = Number(balance) || 0;

    await block.save();

    return res.status(200).json({
      success: true,
      message: 'Block updated successfully',
      block,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};

// @desc    Delete a block
// @route   DELETE /api/blocks/:id
// @access  Private
export const deleteBlock = async (req, res) => {
  try {
    const block = await Block.findById(req.params.id);

    if (!block) {
      return res.status(404).json({ message: 'Block not found' });
    }

    // Check ownership
    if (block.userId.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this block' });
    }

    await block.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Block deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Server Error' });
  }
};
