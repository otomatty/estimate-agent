import { Router } from "express";
import requirementsRoutes from "./requirements";
import questionsRoutes from "./questions";
import ragRoutes from "./rag";

const router = Router();

// APIルートの定義
router.use("/requirements", requirementsRoutes);
router.use("/questions", questionsRoutes);
router.use("/rag", ragRoutes);

export default router;
