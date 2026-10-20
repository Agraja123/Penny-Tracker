import mongoose from "mongoose";

// A "savings card" - a goal/category the user is saving towards,
// e.g. "New Bike", "Emergency Fund", "Goa Trip"
const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: "🐷",
    },
    color: {
      type: String,
      default: "emerald",
    },
    targetAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    targetDate: {
      type: String, // optional YYYY-MM-DD deadline, used by the goal planner
      default: "",
    },
    archived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const SavingsGoal = mongoose.model("SavingsGoal", savingsGoalSchema);
export default SavingsGoal;
