import mongoose from "mongoose";

// A single expense entry with a required note describing what it was for
const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be a whole number (no decimals)",
      },
    },
    note: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: ["Food", "Transport", "Health", "Shopping", "Makeup & Skincare", "Gifts", "Festive", "Entertainment", "Bills", "Other"],
      default: "Other",
    },
    subcategory: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

expenseSchema.index({ userId: 1, date: -1 });

const Expense = mongoose.model("Expense", expenseSchema);
export default Expense;
