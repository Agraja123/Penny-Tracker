import mongoose from "mongoose";
import Expense from "../models/Expense.js";
import SavingEntry from "../models/SavingEntry.js";
import SavingsGoal from "../models/SavingsGoal.js";
import Income from "../models/Income.js";
import Bill from "../models/Bill.js";
import User from "../models/User.js";
import { monthBounds, currentMonth } from "../utils/helpers.js";

const oops = (res, where, error) => {
  console.error(`Error in ${where} controller`, error);
  res.status(500).json({ message: "Internal server error" });
};

const rangeMatch = (userId, from, to) => {
  const match = { userId: new mongoose.Types.ObjectId(userId) };
  if (from || to) {
    match.date = {};
    if (from) match.date.$gte = from;
    if (to) match.date.$lte = to;
  }
  return match;
};

const sum = (arr) => arr.reduce((s, r) => s + r.total, 0);

// Statistics for any period: totals, per-category expenses, per-card savings
// and a time series (per day, or per month for long ranges).
//   GET /stats?from=YYYY-MM-DD&to=YYYY-MM-DD&groupBy=day|month
export const getStats = async (req, res) => {
  try {
    const { from, to } = req.query;
    const groupBy = req.query.groupBy === "month" ? "month" : "day";
    const match = rangeMatch(req.userId, from, to);
    const bucket = groupBy === "month" ? { $substrBytes: ["$date", 0, 7] } : "$date";

    const [byCategory, byGoal, incomeRows, expenseSeries, savingSeries, expenseCount, savingCount] =
      await Promise.all([
        Expense.aggregate([
          { $match: match },
          { $group: { _id: "$category", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        SavingEntry.aggregate([
          { $match: match },
          { $group: { _id: "$goalId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
          { $sort: { total: -1 } },
        ]),
        Income.aggregate([{ $match: match }, { $group: { _id: "$source", total: { $sum: "$amount" } } }]),
        Expense.aggregate([{ $match: match }, { $group: { _id: bucket, total: { $sum: "$amount" } } }]),
        SavingEntry.aggregate([{ $match: match }, { $group: { _id: bucket, total: { $sum: "$amount" } } }]),
        Expense.countDocuments(match),
        SavingEntry.countDocuments(match),
      ]);

    const goals = await SavingsGoal.find({ _id: { $in: byGoal.map((g) => g._id) } });
    const goalsById = Object.fromEntries(goals.map((g) => [String(g._id), g]));

    const seriesMap = {};
    for (const r of expenseSeries) (seriesMap[r._id] ||= { key: r._id, saved: 0, spent: 0 }).spent = r.total;
    for (const r of savingSeries) (seriesMap[r._id] ||= { key: r._id, saved: 0, spent: 0 }).saved = r.total;

    res.json({
      totals: {
        spent: sum(byCategory),
        saved: sum(byGoal),
        income: sum(incomeRows),
        expenseCount,
        savingCount,
      },
      categories: byCategory.map((c) => ({ category: c._id, total: c.total, count: c.count })),
      goals: byGoal.map((g) => ({
        goalId: g._id,
        name: goalsById[String(g._id)]?.name || "Savings",
        icon: goalsById[String(g._id)]?.icon || "🐷",
        total: g.total,
        count: g.count,
      })),
      series: Object.values(seriesMap).sort((a, b) => (a.key < b.key ? -1 : 1)),
      groupBy,
    });
  } catch (error) {
    oops(res, "getStats", error);
  }
};

// The "overall analysis" - how this month's salary/income was split between
// money spent, money saved and what is still left (and what bills are pending).
//   GET /stats/overview?month=YYYY-MM
export const getOverview = async (req, res) => {
  try {
    const month = /^\d{4}-\d{2}$/.test(req.query.month || "") ? req.query.month : currentMonth();
    const { from, to } = monthBounds(month);
    const match = rangeMatch(req.userId, from, to);

    const [user, spentRows, savedRows, incomeRows, pendingBills] = await Promise.all([
      User.findById(req.userId).select("settings"),
      Expense.aggregate([{ $match: match }, { $group: { _id: "$category", total: { $sum: "$amount" } } }]),
      SavingEntry.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Income.aggregate([{ $match: match }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
      Bill.find({ userId: req.userId, isActive: true, nextDueDate: { $lte: to } }),
    ]);

    const salary = user?.settings?.salary || 0;
    const extraIncome = incomeRows[0]?.total || 0;
    const income = salary + extraIncome;
    const spent = sum(spentRows);
    const saved = savedRows[0]?.total || 0;
    const billsPending = pendingBills.reduce((s, b) => s + b.amount, 0);
    const left = income - spent - saved;

    const pct = (n) => (income > 0 ? Math.round((n / income) * 100) : 0);

    res.json({
      month,
      salary,
      extraIncome,
      income,
      spent,
      saved,
      left,
      billsPending,
      billsPendingCount: pendingBills.length,
      percent: { spent: pct(spent), saved: pct(saved), left: Math.max(0, pct(left)) },
      overspent: income > 0 && left < 0,
      topCategories: spentRows
        .map((r) => ({ category: r._id, total: r.total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 3),
    });
  } catch (error) {
    oops(res, "getOverview", error);
  }
};

// Latest entries across savings, expenses and income for the home screen.
export const getActivity = async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 30);
    const filter = { userId: req.userId };
    const [expenses, savings, income] = await Promise.all([
      Expense.find(filter).sort({ createdAt: -1 }).limit(limit),
      SavingEntry.find(filter).sort({ createdAt: -1 }).limit(limit),
      Income.find(filter).sort({ createdAt: -1 }).limit(limit),
    ]);
    const goals = await SavingsGoal.find({ _id: { $in: savings.map((s) => s.goalId) } });
    const goalsById = Object.fromEntries(goals.map((g) => [String(g._id), g]));

    const items = [
      ...expenses.map((e) => ({
        id: e._id, type: "expense", date: e.date, amount: e.amount, createdAt: e.createdAt,
        label: e.note, category: e.category,
      })),
      ...savings.map((s) => ({
        id: s._id, type: "saving", date: s.date, amount: s.amount, createdAt: s.createdAt,
        label: goalsById[String(s.goalId)]?.name || "Savings", icon: goalsById[String(s.goalId)]?.icon,
      })),
      ...income.map((i) => ({
        id: i._id, type: "income", date: i.date, amount: i.amount, createdAt: i.createdAt,
        label: i.note || i.source,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);

    res.json(items);
  } catch (error) {
    oops(res, "getActivity", error);
  }
};
