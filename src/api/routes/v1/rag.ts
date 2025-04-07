import { Router, type Request, type Response } from "express";
import { z } from "zod";
import { processAndStoreDocument, generateRagResponse } from "../../../lib/rag";

const router = Router();

// バリデーションスキーマの定義
const documentSchema = z.object({
	content: z.string().min(1, "内容は必須です"),
	type: z.enum(["text", "markdown", "html", "json"]).default("text"),
	metadata: z.record(z.any()).optional().default({}),
	indexName: z.string().optional(),
});

const querySchema = z.object({
	query: z.string().min(1, "質問は必須です"),
	filter: z.record(z.any()).optional().default({}),
	indexName: z.string().optional(),
});

/**
 * ドキュメント登録ハンドラ
 */
const handleDocumentPost = async (req: Request, res: Response) => {
	try {
		// リクエストボディのバリデーション
		const validationResult = documentSchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				error: "無効なリクエスト",
				details: validationResult.error.format(),
			});
			return;
		}

		const { content, type, metadata, indexName } = validationResult.data;

		// ドキュメントを処理してベクトルDBに保存
		await processAndStoreDocument(content, type, metadata, indexName);

		res.status(201).json({
			success: true,
			message: "ドキュメントが正常に登録されました",
		});
	} catch (error) {
		console.error("ドキュメント登録エラー:", error);
		res.status(500).json({
			success: false,
			error: "サーバーエラー",
			message:
				error instanceof Error ? error.message : "予期せぬエラーが発生しました",
		});
	}
};

/**
 * RAGクエリハンドラ
 */
const handleQueryPost = async (req: Request, res: Response) => {
	try {
		// リクエストボディのバリデーション
		const validationResult = querySchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				error: "無効なリクエスト",
				details: validationResult.error.format(),
			});
			return;
		}

		const { query, filter, indexName } = validationResult.data;

		// RAGを使用して回答を生成
		const response = await generateRagResponse(query, filter, indexName);

		res.status(200).json({
			success: true,
			query,
			response,
		});
	} catch (error) {
		console.error("RAG検索エラー:", error);
		res.status(500).json({
			success: false,
			error: "サーバーエラー",
			message:
				error instanceof Error ? error.message : "予期せぬエラーが発生しました",
		});
	}
};

/**
 * @route POST /api/v1/rag/documents
 * @desc ドキュメントを登録する
 * @access Public
 */
router.post("/documents", handleDocumentPost);

/**
 * @route POST /api/v1/rag/query
 * @desc 質問に対してRAG検索して回答を返す
 * @access Public
 */
router.post("/query", handleQueryPost);

export default router;
