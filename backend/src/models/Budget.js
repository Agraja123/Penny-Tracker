import mongoose from "mongoose";

// A monthly spending limit. category is "Overall" or one of the expense categories.
const budgetSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, required: true, trim: true },
    limit: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: "Limit must be a whole number (no decimals)" },
    },
  },
  { timestamps: true }
);

budgetSchema.index({ userId: 1, category: 1 }, { unique: true });

export default mongoose.model("Budget", budgetSchema);
