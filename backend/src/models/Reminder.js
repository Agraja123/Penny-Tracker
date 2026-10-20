import mongoose from "mongoose";

// A scheduled nudge - "log today's savings at 9 PM", "note your expenses", etc.
const reminderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    kind: { type: String, enum: ["saving", "expense", "bill", "custom"], default: "custom" },
    time: { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ }, // HH:MM, 24h
    frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: "daily" },
    weekdays: { type: [Number], default: [] }, // 0 = Sunday ... 6 = Saturday (weekly)
    dayOfMonth: { type: Number, min: 1, max: 31, default: 1 }, // monthly
    enabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Reminder", reminderSchema);
