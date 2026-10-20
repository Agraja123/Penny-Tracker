import express from "express";
import { addGoal, getGoals, updateGoal, deleteGoal } from "../controllers/savingsGoalController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", addGoal);
router.get("/", getGoals);
router.put("/:id", updateGoal);
router.delete("/:id", deleteGoal);

export default router;
