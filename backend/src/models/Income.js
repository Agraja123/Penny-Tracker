import mongoose from "mongoose";

// Extra income on a specific day (freelance, gift, interest...).
// The regular monthly salary lives in the user's settings.
const incomeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    date: { type: String, required: true, trim: true }, // YYYY-MM-DD
    amount: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: "Amount must be a whole number (no decimals)" },
    },
    source: {
      type: String,
      enum: ["Salary", "Freelance", "Gift", "Interest", "Other"],
      default: "Other",
    },
    note: { type: String, trim: true, maxlength: 200, default: "" },
  },
  { timestamps: true }
);

incomeSchema.index({ userId: 1, date: -1 });

export default mongoose.model("Income", incomeSchema);
