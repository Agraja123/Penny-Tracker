import express from "express";
import { getSettings, updateSettings, verifyPin, changePin } from "../controllers/settingsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getSettings);
router.put("/", updateSettings);
router.post("/verify-pin", verifyPin);
router.post("/change-pin", changePin);

export default router;
