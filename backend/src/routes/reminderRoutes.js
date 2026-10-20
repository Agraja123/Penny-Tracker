import express from "express";
import Reminder from "../models/Reminder.js";
import { makeCrud, crudRouter } from "../controllers/crud.js";
import { requireAuth } from "../middleware/auth.js";

const crud = makeCrud(Reminder, {
  label: "Reminder",
  fields: ["title", "kind", "time", "frequency", "weekdays", "dayOfMonth", "enabled"],
  sort: { time: 1 },
  prepare: (body, isUpdate) => {
    const data = { ...body };
    if (!isUpdate || body.title !== undefined) {
      if (!body.title || !String(body.title).trim()) return { error: "Give the reminder a title" };
      data.title = String(body.title).trim();
    }
    if (!isUpdate || body.time !== undefined) {
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(body.time || ""))) return { error: "Pick a valid time" };
    }
    if (data.weekdays) {
      data.weekdays = [...new Set(data.weekdays.map(Number).filter((d) => d >= 0 && d <= 6))];
    }
    if (data.frequency === "weekly" && data.weekdays && !data.weekdays.length) {
      return { error: "Pick at least one day of the week" };
    }
    return { data };
  },
});

export default crudRouter(express, requireAuth, crud);
