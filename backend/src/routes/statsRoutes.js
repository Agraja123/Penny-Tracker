import express from "express";
import { getStats, getOverview, getActivity } from "../controllers/statsController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.get("/", getStats);
router.get("/overview", getOverview);
router.get("/activity", getActivity);

export default router;
