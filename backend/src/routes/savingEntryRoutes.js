import express from "express";
import {
  addSavingEntry,
  getSavingEntries,
  updateSavingEntry,
  deleteSavingEntry,
} from "../controllers/savingEntryController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", addSavingEntry);
router.get("/", getSavingEntries);
router.put("/:id", updateSavingEntry);
router.delete("/:id", deleteSavingEntry);

export default router;
