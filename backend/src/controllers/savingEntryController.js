import SavingEntry from "../models/SavingEntry.js";

export const addSavingEntry = async (req, res) => {
  try {
    const { goalId, date, amount } = req.body;
    if (!goalId || !date) {
      return res.status(400).json({ message: "Goal and date are required" });
    }
    const whole = Math.round(Number(amount));
    if (!whole || whole < 1) {
      return res.status(400).json({ message: "Enter a whole rupee amount (e.g. 20)" });
    }

    const entry = await SavingEntry.create({
      userId: req.userId,
      goalId,
      date,
      amount: whole,
    });
    res.status(201).json(entry);
  } catch (error) {
    console.error("Error in addSavingEntry controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Supports optional query params: goalId, from, to (YYYY-MM-DD) for filtering
export const getSavingEntries = async (req, res) => {
  try {
    const query = { userId: req.userId };
    if (req.query.goalId) query.goalId = req.query.goalId;
    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = req.query.from;
      if (req.query.to) query.date.$lte = req.query.to;
    }

    const entries = await SavingEntry.find(query).sort({ date: -1, createdAt: -1 });
    res.json(entries);
  } catch (error) {
    console.error("Error in getSavingEntries controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateSavingEntry = async (req, res) => {
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

    const entry = await SavingEntry.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      update,
      { new: true }
    );
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json(entry);
  } catch (error) {
    console.error("Error in updateSavingEntry controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteSavingEntry = async (req, res) => {
  try {
    const entry = await SavingEntry.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!entry) return res.status(404).json({ message: "Entry not found" });
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSavingEntry controller", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
