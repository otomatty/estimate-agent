import { supabase } from "../supabase";
import type {
	TemporaryEstimateQuestion,
	AnswerQuestionInput,
	QuestionTemplate,
} from "../models/types";

export class QuestionService {
	/**
	 * 一時見積もりに対する質問を作成する
	 */
	async createEstimateQuestions(
		estimateId: string,
		questions: Omit<
			TemporaryEstimateQuestion,
			"id" | "temporary_estimate_id" | "created_at" | "updated_at"
		>[],
	): Promise<TemporaryEstimateQuestion[]> {
		try {
			const questionsToInsert = questions.map((question, index) => ({
				...question,
				temporary_estimate_id: estimateId,
				position: index,
				is_answered: false,
			}));

			const { data, error } = await supabase
				.from("temporary_estimate_questions")
				.insert(questionsToInsert)
				.select();

			if (error) {
				throw new Error(`質問作成エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("質問作成に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 一時見積もりの質問を取得する
	 */
	async getEstimateQuestions(
		estimateId: string,
	): Promise<TemporaryEstimateQuestion[]> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimate_questions")
				.select("*")
				.eq("temporary_estimate_id", estimateId)
				.order("position", { ascending: true });

			if (error) {
				throw new Error(`質問取得エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("質問取得に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 質問に回答する
	 */
	async answerQuestion(
		input: AnswerQuestionInput,
	): Promise<TemporaryEstimateQuestion> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimate_questions")
				.update({
					answer: input.answer,
					is_answered: true,
					updated_at: new Date().toISOString(),
				})
				.eq("id", input.questionId)
				.select()
				.single();

			if (error) {
				throw new Error(`回答保存エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("回答保存に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * すべての質問テンプレートを取得する
	 */
	async getAllQuestionTemplates(): Promise<QuestionTemplate[]> {
		try {
			const { data, error } = await supabase
				.from("question_templates")
				.select("*")
				.order("position", { ascending: true });

			if (error) {
				throw new Error(`テンプレート取得エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("テンプレート取得に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * カテゴリに合致する質問テンプレートを取得する
	 */
	async getQuestionTemplatesByCategory(
		category: string,
	): Promise<QuestionTemplate[]> {
		try {
			const { data, error } = await supabase
				.from("question_templates")
				.select("*")
				.eq("category", category)
				.order("position", { ascending: true });

			if (error) {
				throw new Error(`テンプレート取得エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("テンプレート取得に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 質問テンプレートから一時見積もりの質問を生成する
	 */
	async generateQuestionsFromTemplates(
		estimateId: string,
		initialRequirements: string,
		category?: string,
	): Promise<TemporaryEstimateQuestion[]> {
		try {
			// カテゴリが指定されている場合はその質問を、なければ全質問を取得
			const templates = category
				? await this.getQuestionTemplatesByCategory(category)
				: await this.getAllQuestionTemplates();

			// 質問テンプレートから質問を生成
			const questions = templates.map((template) => ({
				question: template.question,
				template_id: template.id,
				position: template.position,
				category: template.category,
				is_answered: false,
			}));

			// 質問を保存
			return await this.createEstimateQuestions(estimateId, questions);
		} catch (error) {
			console.error("質問生成に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 全ての質問が回答済みかチェックする
	 */
	async areAllQuestionsAnswered(estimateId: string): Promise<boolean> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimate_questions")
				.select("is_answered")
				.eq("temporary_estimate_id", estimateId);

			if (error) {
				throw new Error(`質問チェックエラー: ${error.message}`);
			}

			// すべての質問が回答済みかチェック
			return data.length > 0 && data.every((q) => q.is_answered);
		} catch (error) {
			console.error("質問チェックに失敗しました:", error);
			throw error;
		}
	}
}
