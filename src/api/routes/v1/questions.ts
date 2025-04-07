import { Router } from "express";
import {
	getQuestions,
	answerQuestion,
} from "../../controllers/v1/questionsController";

const router = Router();

/**
 * @route GET /api/v1/questions
 * @desc セッションに関連付けられた質問リストを取得する
 * @access Public
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
router.get("/", getQuestions as any);

/**
 * @route POST /api/v1/questions/:questionId/answer
 * @desc 特定の質問に回答する
 * @access Public
 */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
router.post("/:questionId/answer", answerQuestion as any);

export default router;
