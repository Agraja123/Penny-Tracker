import mongoose from "mongoose";

// A single day's saved amount towards a particular savings goal/card
const savingEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SavingsGoal",
      required: true,
      index: true,
    },
    date: {
      // stored as YYYY-MM-DD so it sorts and filters cleanly
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      // whole rupees only - no paise/decimals
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be a whole number (no decimals)",
      },
    },
  },
  { timestamps: true }
);

savingEntrySchema.index({ userId: 1, date: -1 });

const SavingEntry = mongoose.model("SavingEntry", savingEntrySchema);
export default SavingEntry;
