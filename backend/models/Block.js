import mongoose from 'mongoose';

const BlockSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Block name is required'],
      trim: true,
    },
    mode: {
      type: String,
      enum: {
        values: ['online', 'offline', 'both'],
        message: '{VALUE} is not a valid mode (must be online, offline, or both)',
      },
      required: [true, 'Mode is required'],
      default: 'both',
    },
    color: {
      type: String,
      default: 'rosePink',
    },
    balance: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Block = mongoose.model('Block', BlockSchema);
export default Block;
