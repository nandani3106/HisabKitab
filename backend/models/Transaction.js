import mongoose from 'mongoose';

const TransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    blockId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Block',
      required: [true, 'Block ID is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    mode: {
      type: String,
      enum: {
        values: ['online', 'offline'],
        message: '{VALUE} is not a valid mode (must be online or offline)',
      },
      required: [true, 'Transaction mode is required'],
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model('Transaction', TransactionSchema);
export default Transaction;
