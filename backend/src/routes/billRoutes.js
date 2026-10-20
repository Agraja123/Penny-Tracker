import express from "express";
import { addBill, getBills, updateBill, deleteBill, payBill } from "../controllers/billController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

router.post("/", addBill);
router.get("/", getBills);
router.post("/:id/pay", payBill);
router.put("/:id", updateBill);
router.delete("/:id", deleteBill);

export default router;
