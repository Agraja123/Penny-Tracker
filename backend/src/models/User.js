import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 20,
    },
    pinHash: {
      type: String,
      required: true,
    },
    displayName: {
      type: String,
      trim: true,
    },
    settings: {
      salary: { type: Number, default: 0, min: 0 }, // monthly salary, whole rupees
      salaryDay: { type: Number, default: 1, min: 1, max: 31 }, // day of month it is credited
      theme: { type: String, default: "penny" },
      appLock: {
        enabled: { type: Boolean, default: false },
        timeoutMinutes: { type: Number, default: 1, min: 0, max: 60 },
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
