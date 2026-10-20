import mongoose from "mongoose";

const whole = {
  validator: (v) => v === undefined || v === null || Number.isInteger(v),
  message: "Amount must be a whole number (no decimals)",
};

// One model for both sections of "Bills and Loans":
//   kind "bill" - wifi, electricity, credit card, rent, subscriptions... (any title)
//   kind "loan" - an EMI loan with a remaining balance that goes down on each payment
const billSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    kind: { type: String, enum: ["bill", "loan"], default: "bill" },
    title: { type: String, required: true, trim: true, maxlength: 60 },
    amount: { type: Number, required: true, min: 1, validate: whole }, // bill amount, or the EMI for a loan
    frequency: { type: String, enum: ["once", "weekly", "monthly", "yearly"], default: "monthly" },
    nextDueDate: { type: String, required: true }, // YYYY-MM-DD
    anchorDay: { type: Number, min: 1, max: 31 }, // day-of-month the bill is really due on
    remindDaysBefore: { type: Number, default: 2, min: 0, max: 30 },
    isActive: { type: Boolean, default: true },
    lastPaidDate: { type: String },
    paidCount: { type: Number, default: 0 },

    // loan-only fields
    lender: { type: String, trim: true, maxlength: 60 },
    totalAmount: { type: Number, min: 0, validate: whole },
    remainingAmount: { type: Number, min: 0, validate: whole },
    interestRate: { type: Number, min: 0, max: 100 }, // % per year, informational
  },
  { timestamps: true }
);

billSchema.index({ userId: 1, nextDueDate: 1 });

export default mongoose.model("Bill", billSchema);
