import Bill from "../models/Bill.js";
import Expense from "../models/Expense.js";
import { wholeAmount, isDateKey, addPeriod, todayKey, pick } from "../utils/helpers.js";

const FIELDS = [
  "kind", "title", "amount", "frequency", "nextDueDate", "remindDaysBefore", "isActive",
  "lender", "totalAmount", "remainingAmount", "interestRate",
];

const clean = (body, isUpdate) => {
  const data = pick(body, FIELDS);

  if (!isUpdate || data.title !== undefined) {
    if (!data.title || !String(data.title).trim()) return { error: "Give it a title (e.g. Wifi bill)" };
    data.title = String(data.title).trim();
  }
  if (!isUpdate || data.amount !== undefined) {
    data.amount = wholeAmount(data.amount);
    if (!data.amount) return { error: "Enter a whole rupee amount (e.g. 499)" };
  }
  if (!isUpdate || data.nextDueDate !== undefined) {
    if (!isDateKey(data.nextDueDate)) return { error: "Pick the next due date" };
    data.anchorDay = Number(data.nextDueDate.slice(8, 10));
  }
  for (const key of ["totalAmount", "remainingAmount"]) {
    if (data[key] !== undefined && data[key] !== "" && data[key] !== null) {
      data[key] = Math.max(0, Math.round(Number(data[key])) || 0);
    } else {
      delete data[key];
    }
  }
  if (data.interestRate === "" || data.interestRate === null) delete data.interestRate;
  if (data.interestRate !== undefined) data.interestRate = Number(data.interestRate) || 0;

  if (data.kind === "loan" && !isUpdate) {
    if (data.totalAmount === undefined && data.remainingAmount === undefined) {
      return { error: "Enter the loan amount (or what is remaining)" };
    }
    if (data.remainingAmount === undefined) data.remainingAmount = data.totalAmount;
    if (data.totalAmount === undefined) data.totalAmount = data.remainingAmount;
    if (data.frequency === "once") data.frequency = "monthly";
  }
  return { data };
};

const oops = (res, where, error) => {
  console.error(`Error in ${where} controller`, error);
  res.status(500).json({ message: "Internal server error" });
};

export const addBill = async (req, res) => {
  try {
    const cleaned = clean(req.body, false);
    if (cleaned.error) return res.status(400).json({ message: cleaned.error });
    const bill = await Bill.create({ ...cleaned.data, userId: req.userId });
    res.status(201).json(bill);
  } catch (error) {
    oops(res, "addBill", error);
  }
};

export const getBills = async (req, res) => {
  try {
    const query = { userId: req.userId };
    if (req.query.kind) query.kind = req.query.kind;
    const bills = await Bill.find(query).sort({ isActive: -1, nextDueDate: 1 });
    res.json(bills);
  } catch (error) {
    oops(res, "getBills", error);
  }
};

export const updateBill = async (req, res) => {
  try {
    const cleaned = clean(req.body, true);
    if (cleaned.error) return res.status(400).json({ message: cleaned.error });
    const bill = await Bill.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      cleaned.data,
      { new: true, runValidators: true }
    );
    if (!bill) return res.status(404).json({ message: "Not found" });
    res.json(bill);
  } catch (error) {
    oops(res, "updateBill", error);
  }
};

export const deleteBill = async (req, res) => {
  try {
    const bill = await Bill.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    oops(res, "deleteBill", error);
  }
};

// Marks the current instalment as paid:
//  - logs it as a "Bills" expense so it shows up in expense totals,
//  - moves the due date forward (or closes a one-time bill),
//  - lowers the remaining balance of a loan.
export const payBill = async (req, res) => {
  try {
    const bill = await Bill.findOne({ _id: req.params.id, userId: req.userId });
    if (!bill) return res.status(404).json({ message: "Not found" });
    if (!bill.isActive) return res.status(400).json({ message: "This one is already closed" });

    let amount = bill.amount;
    if (req.body.amount !== undefined) {
      amount = wholeAmount(req.body.amount);
      if (!amount) return res.status(400).json({ message: "Enter a whole rupee amount" });
    }
    if (bill.kind === "loan" && bill.remainingAmount > 0) amount = Math.min(amount, bill.remainingAmount);

    const date = isDateKey(req.body.date) ? req.body.date : todayKey();
    await Expense.create({
      userId: req.userId,
      date,
      amount,
      note: bill.kind === "loan" ? `${bill.title} EMI` : bill.title,
      category: "Bills",
    });

    bill.lastPaidDate = date;
    bill.paidCount += 1;

    if (bill.kind === "loan") {
      bill.remainingAmount = Math.max(0, (bill.remainingAmount || 0) - amount);
      if (bill.remainingAmount === 0) bill.isActive = false;
    }
    if (bill.frequency === "once") {
      bill.isActive = false;
    } else if (bill.isActive) {
      bill.nextDueDate = addPeriod(bill.nextDueDate, bill.frequency, bill.anchorDay);
    }

    await bill.save();
    res.json(bill);
  } catch (error) {
    oops(res, "payBill", error);
  }
};
