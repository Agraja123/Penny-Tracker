import express from "express";
import Income from "../models/Income.js";
import { makeCrud, crudRouter } from "../controllers/crud.js";
import { requireAuth } from "../middleware/auth.js";
import { wholeAmount, isDateKey } from "../utils/helpers.js";

const SOURCES = ["Salary", "Freelance", "Gift", "Interest", "Other"];

const crud = makeCrud(Income, {
  label: "Income entry",
  fields: ["date", "amount", "source", "note"],
  sort: { date: -1, createdAt: -1 },
  filters: (q) => {
    const f = {};
    if (q.from || q.to) {
      f.date = {};
      if (q.from) f.date.$gte = q.from;
      if (q.to) f.date.$lte = q.to;
    }
    return f;
  },
  prepare: (body, isUpdate) => {
    const data = { ...body };
    if (!isUpdate || body.amount !== undefined) {
      data.amount = wholeAmount(body.amount);
      if (!data.amount) return { error: "Enter a whole rupee amount (e.g. 5000)" };
    }
    if (!isUpdate || body.date !== undefined) {
      if (!isDateKey(body.date)) return { error: "Date is required" };
    }
    if (data.source && !SOURCES.includes(data.source)) data.source = "Other";
    if (data.note !== undefined) data.note = String(data.note).trim();
    return { data };
  },
});

export default crudRouter(express, requireAuth, crud);
