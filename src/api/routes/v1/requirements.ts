import { Router } from "express";
import { createInitialRequirement } from "../../controllers/v1/requirementsController";

const router = Router();

/**
 * @route POST /api/v1/requirements
 * @desc 初期要件を受け取り、見積もりプロセスを開始する
 * @access Public
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
router.post("/", createInitialRequirement as any);

export default router;
