import type { Request, Response } from "express";
import type {
	QuestionsResponse,
	AnswerQuestionRequest,
	AnswerQuestionResponse,
} from "../../types";
import supabase from "../../services/supabaseService";

/**
 * セッションに関連付けられた質問を取得する
 * @param req リクエスト
 * @param res レスポンス
 */
export const getQuestions = async (
	req: Request<unknown, unknown, unknown, { session_id: string }>,
	res: Response<QuestionsResponse>,
) => {
	try {
		const { session_id } = req.query;

		if (!session_id) {
			return res.status(400).json({
				questions: [],
				total: 0,
				session_id: "",
			});
		}

		// セッションIDに関連付けられた一時見積もりを検索
		const { data: estimateData, error: estimateError } = await supabase
			.from("temporary_estimates")
			.select("id")
			.eq("session_id", session_id)
			.single();

		if (estimateError || !estimateData) {
			console.error("Estimate not found:", estimateError);
			return res.status(404).json({
				questions: [],
				total: 0,
				session_id,
			});
		}

		// 質問データを取得
		const { data: questionsData, error: questionsError } = await supabase
			.from("temporary_estimate_questions")
			.select(`
        id,
        question,
        is_answered,
        position,
        category,
        template_id
      `)
			.eq("temporary_estimate_id", estimateData.id)
			.order("position", { ascending: true });

		if (questionsError) {
			console.error("Error fetching questions:", questionsError);
			return res.status(500).json({
				questions: [],
				total: 0,
				session_id,
			});
		}

		// 質問がない場合はデフォルトの質問を生成する
		// TODO: マイルストーン2で実装予定 - 要件に基づいて質問を動的生成

		// 質問データをレスポンス形式に変換
		const formattedQuestions = questionsData.map((q) => ({
			id: q.id,
			template_id: q.template_id || undefined,
			question: q.question,
			category: q.category || "general",
			position: q.position,
			is_required: true,
		}));

		return res.status(200).json({
			questions: formattedQuestions,
			total: formattedQuestions.length,
			session_id,
		});
	} catch (error) {
		console.error("Error getting questions:", error);
		return res.status(500).json({
			questions: [],
			total: 0,
			session_id: req.query.session_id || "",
		});
	}
};

/**
 * 質問に回答する
 * @param req リクエスト
 * @param res レスポンス
 */
export const answerQuestion = async (
	req: Request<{ questionId: string }, unknown, AnswerQuestionRequest>,
	res: Response<AnswerQuestionResponse>,
) => {
	try {
		const { questionId } = req.params;
		const { session_id, answer } = req.body;

		if (!session_id || !answer) {
			return res.status(400).json({
				success: false,
				remaining_questions: 0,
				session_id: session_id || "",
			});
		}

		// 質問データを更新
		const { error: updateError } = await supabase
			.from("temporary_estimate_questions")
			.update({
				answer,
				is_answered: true,
				updated_at: new Date().toISOString(),
			})
			.eq("id", questionId);

		if (updateError) {
			console.error("Error updating question answer:", updateError);
			return res.status(500).json({
				success: false,
				remaining_questions: 0,
				session_id,
			});
		}

		// 未回答の質問数を取得
		const { data: estimateData } = await supabase
			.from("temporary_estimates")
			.select("id")
			.eq("session_id", session_id)
			.single();

		if (!estimateData) {
			return res.status(404).json({
				success: false,
				remaining_questions: 0,
				session_id,
			});
		}

		const { count, error: countError } = await supabase
			.from("temporary_estimate_questions")
			.select("id", { count: "exact", head: true })
			.eq("temporary_estimate_id", estimateData.id)
			.eq("is_answered", false);

		if (countError) {
			console.error("Error counting remaining questions:", countError);
			return res.status(500).json({
				success: false,
				remaining_questions: 0,
				session_id,
			});
		}

		return res.status(200).json({
			success: true,
			remaining_questions: count || 0,
			session_id,
		});
	} catch (error) {
		console.error("Error answering question:", error);
		return res.status(500).json({
			success: false,
			remaining_questions: 0,
			session_id: req.body.session_id || "",
		});
	}
};
