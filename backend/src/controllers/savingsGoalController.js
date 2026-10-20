import mongoose from "mongoose";
import SavingsGoal from "../models/SavingsGoal.js";
import SavingEntry from "../models/SavingEntry.js";
import { pick } from "../utils/helpers.js";

export const addGoal = async (req, res) => {
  try {
    const { name, icon, color, targetAmount, targetDate } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Give this savings card a name" });
    }
    const goal = await SavingsGoal.create({
      userId: req.userId,
      name: name.trim(),
      icon,
      color,
      targetAmount: targetAmount || 0,
      targetDate: targetDate || "",
    });
    res.status(201).json(goal);
  } catch (error) {
    console.error("Error in addGoal controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getGoals = async (req, res) => {
  try {
    const goals = await SavingsGoal.find({ userId: req.userId, archived: false }).sort({ createdAt: -1 });

    // attach total saved so far for each goal
    const totals = await SavingEntry.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: "$goalId", total: { $sum: "$amount" } } },
    ]);
    const totalsMap = Object.fromEntries(totals.map((t) => [String(t._id), t.total]));

    const withTotals = goals.map((g) => ({
      ...g.toObject(),
      totalSaved: totalsMap[String(g._id)] || 0,
    }));

    res.json(withTotals);
  } catch (error) {
    console.error("Error in getGoals controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      pick(req.body, ["name", "icon", "color", "targetAmount", "targetDate", "archived"]),
      { new: true }
    );
    if (!goal) return res.status(404).json({ message: "Savings card not found" });
    res.json(goal);
  } catch (error) {
    console.error("Error in updateGoal controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await SavingsGoal.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ message: "Savings card not found" });
    await SavingEntry.deleteMany({ goalId: req.params.id, userId: req.userId });
    res.json({ message: "Savings card deleted successfully" });
  } catch (error) {
    console.error("Error in deleteGoal controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
