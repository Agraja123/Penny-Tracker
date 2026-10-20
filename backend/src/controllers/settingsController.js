import bcrypt from "bcryptjs";
import User from "../models/User.js";

const PIN_REGEX = /^\d{4}$/;
const THEMES = ["penny", "penny-dark", "ocean", "sunset"];

const oops = (res, where, error) => {
  console.error(`Error in ${where} controller`, error);
  res.status(500).json({ message: "Internal server error" });
};

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("settings");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.settings);
  } catch (error) {
    oops(res, "getSettings", error);
  }
};

export const updateSettings = async (req, res) => {
  try {
    const b = req.body;
    const set = {};

    if (b.salary !== undefined) {
      const salary = Math.round(Number(b.salary));
      if (!Number.isFinite(salary) || salary < 0) {
        return res.status(400).json({ message: "Enter your salary in whole rupees" });
      }
      set["settings.salary"] = salary;
    }
    if (b.salaryDay !== undefined) {
      const day = Math.round(Number(b.salaryDay));
      if (!(day >= 1 && day <= 31)) return res.status(400).json({ message: "Salary day must be 1-31" });
      set["settings.salaryDay"] = day;
    }
    if (b.theme !== undefined) {
      if (!THEMES.includes(b.theme)) return res.status(400).json({ message: "Unknown theme" });
      set["settings.theme"] = b.theme;
    }
    if (b.appLock) {
      if (b.appLock.enabled !== undefined) set["settings.appLock.enabled"] = !!b.appLock.enabled;
      if (b.appLock.timeoutMinutes !== undefined) {
        const t = Math.round(Number(b.appLock.timeoutMinutes));
        if (!(t >= 0 && t <= 60)) return res.status(400).json({ message: "Invalid lock timeout" });
        set["settings.appLock.timeoutMinutes"] = t;
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, { $set: set }, { new: true }).select("settings");
    res.json(user.settings);
  } catch (error) {
    oops(res, "updateSettings", error);
  }
};

// Used by the app lock screen - confirms the PIN without issuing a new session.
export const verifyPin = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    const ok = await bcrypt.compare(String(req.body.pin || ""), user.pinHash);
    if (!ok) return res.status(401).json({ message: "Incorrect PIN" });
    res.json({ ok: true });
  } catch (error) {
    oops(res, "verifyPin", error);
  }
};

export const changePin = async (req, res) => {
  try {
    const currentPin = String(req.body.currentPin || "");
    const newPin = String(req.body.newPin || "");
    if (!PIN_REGEX.test(newPin)) return res.status(400).json({ message: "New PIN must be exactly 4 digits" });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (!(await bcrypt.compare(currentPin, user.pinHash))) {
      return res.status(401).json({ message: "Current PIN is incorrect" });
    }
    user.pinHash = await bcrypt.hash(newPin, 10);
    await user.save();
    res.json({ message: "PIN changed" });
  } catch (error) {
    oops(res, "changePin", error);
  }
};
