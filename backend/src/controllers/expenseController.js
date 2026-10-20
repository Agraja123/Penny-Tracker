import Expense from "../models/Expense.js";

const SUBCATEGORIES = {
  Food: ["Meal", "Snacks"],
  Transport: ["Public transport", "Private transport"],
  Health: ["Checkups", "Medicines"],
  Shopping: ["Clothes", "Footwear", "Perfumes", "Bags"],
  Entertainment: ["Movie", "Game zone"],
};

// Only keep a sub-category if it really belongs to the chosen category
const cleanSub = (category, sub) => (SUBCATEGORIES[category || "Other"]?.includes(sub) ? sub : "");

export const addExpense = async (req, res) => {
  try {
    const { date, amount, note, category, subcategory } = req.body;
    const whole = Math.round(Number(amount));
    if (!date) return res.status(400).json({ message: "Date is required" });
    if (!whole || whole < 1) {
      return res.status(400).json({ message: "Enter a whole rupee amount (e.g. 20)" });
    }
    if (!note || !note.trim()) {
      return res.status(400).json({ message: "Add a short note for what this was spent on" });
    }

    const expense = await Expense.create({
      userId: req.userId,
      date,
      amount: whole,
      note: note.trim(),
      category: category || "Other",
      subcategory: cleanSub(category, subcategory),
    });
    res.status(201).json(expense);
  } catch (error) {
    console.error("Error in addExpense controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getExpenses = async (req, res) => {
  try {
    const query = { userId: req.userId };
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = req.query.from;
      if (req.query.to) query.date.$lte = req.query.to;
    }
    if (req.query.category) query.category = req.query.category;

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    console.error("Error in getExpenses controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateExpense = async (req, res) => {
  try {
    const update = {};
    if (req.body.amount !== undefined) {
      const whole = Math.round(Number(req.body.amount));
      if (!whole || whole < 1) {
        return res.status(400).json({ message: "Enter a whole rupee amount (e.g. 20)" });
      }
      update.amount = whole;
    }
    if (req.body.date) update.date = req.body.date;
    if (req.body.note !== undefined) {
      if (!req.body.note.trim()) {
        return res.status(400).json({ message: "Add a short note for what this was spent on" });
      }
      update.note = req.body.note.trim();
    }
    if (req.body.category) {
      update.category = req.body.category;
      update.subcategory = cleanSub(req.body.category, req.body.subcategory);
    } else if (req.body.subcategory !== undefined) {
      const current = await Expense.findOne({ _id: req.params.id, userId: req.userId }).select("category");
      if (current) update.subcategory = cleanSub(current.category, req.body.subcategory);
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json(expense);
  } catch (error) {
    console.error("Error in updateExpense controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!expense) return res.status(404).json({ message: "Expense not found" });
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in deleteExpense controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
