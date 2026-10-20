import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import savingsGoalRoutes from "./routes/savingsGoalRoutes.js";
import savingEntryRoutes from "./routes/savingEntryRoutes.js";
import expenseRoutes from "./routes/expenseRoutes.js";
import incomeRoutes from "./routes/incomeRoutes.js";
import billRoutes from "./routes/billRoutes.js";
import budgetRoutes from "./routes/budgetRoutes.js";
import reminderRoutes from "./routes/reminderRoutes.js";
import settingsRoutes from "./routes/settingsRoutes.js";
import statsRoutes from "./routes/statsRoutes.js";

import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();
const app = express();
const port = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/", (req, res) => res.json({ status: "Penny Tracker API running" }));

app.use("/auth", authRoutes);
app.use("/goals", savingsGoalRoutes);
app.use("/saving-entries", savingEntryRoutes);
app.use("/expenses", expenseRoutes);
app.use("/income", incomeRoutes);
app.use("/bills", billRoutes);
app.use("/budgets", budgetRoutes);
app.use("/reminders", reminderRoutes);
app.use("/settings", settingsRoutes);
app.use("/stats", statsRoutes);

connectDB().then(() => {
  app.listen(port, () => {
    console.log(`Penny Tracker API listening on http://localhost:${port}`);
  });
});
