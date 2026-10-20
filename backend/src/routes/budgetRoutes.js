import express from "express";
import Budget from "../models/Budget.js";
import { makeCrud, crudRouter } from "../controllers/crud.js";
import { requireAuth } from "../middleware/auth.js";
import { wholeAmount } from "../utils/helpers.js";

const CATEGORIES = ["Overall", "Food", "Transport", "Health", "Shopping", "Makeup & Skincare", "Gifts", "Festive", "Entertainment", "Bills", "Other"];

const crud = makeCrud(Budget, {
  label: "Budget",
  fields: ["category", "limit"],
  sort: { category: 1 },
  prepare: (body, isUpdate) => {
    const data = { ...body };
    if (!isUpdate || body.limit !== undefined) {
      data.limit = wholeAmount(body.limit);
      if (!data.limit) return { error: "Enter a whole rupee limit (e.g. 3000)" };
    }
    if (!isUpdate || body.category !== undefined) {
      if (!CATEGORIES.includes(body.category)) return { error: "Pick a valid category" };
    }
    return { data };
  },
});

export default crudRouter(express, requireAuth, crud);
