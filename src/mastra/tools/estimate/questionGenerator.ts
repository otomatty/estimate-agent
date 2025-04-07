import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import supabase from "../../../api/services/supabaseService";

// 質問テンプレートの型定義
interface QuestionTemplate {
	id: string;
	question: string;
	description?: string;
	category: string;
	position: number;
	is_required: boolean;
	template_id?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[key: string]: unknown;
}

export const generateQuestionsTool = createTool({
	id: "generate-questions",
	description: "システムカテゴリに基づいて質問リストを生成するツール",
	inputSchema: z.object({
		categoryId: z.string().describe("システムカテゴリのID"),
		temporaryEstimateId: z.string().describe("一時見積もりのID"),
		initialRequirements: z.string().describe("初期要件の説明"),
	}),
	outputSchema: z.object({
		questions: z.array(
			z.object({
				id: z.string(),
				question: z.string(),
				category: z.string(),
				position: z.number(),
				is_required: z.boolean(),
				template_id: z.string().optional(),
			}),
		),
		questionCount: z.number(),
	}),
	execute: async ({ context }) => {
		try {
			// カテゴリ情報を取得
			const { data: category, error: categoryError } = await supabase
				.from("system_categories")
				.select("*")
				.eq("id", context.categoryId)
				.single();

			if (categoryError || !category) {
				throw new Error(
					`カテゴリの取得に失敗しました: ${categoryError?.message || "カテゴリが見つかりません"}`,
				);
			}

			// 共通質問テンプレートを取得
			const { data: commonTemplates, error: commonError } = await supabase
				.from("question_templates")
				.select("*")
				.eq("category", "common")
				.order("position", { ascending: true });

			if (commonError) {
				throw new Error(
					`共通質問テンプレートの取得に失敗しました: ${commonError.message}`,
				);
			}

			// カテゴリ固有の質問テンプレートを取得
			const categoryKey = category.name.toLowerCase().includes("crm")
				? "crm"
				: category.name.includes("在庫")
					? "inventory"
					: category.name.includes("予約")
						? "booking"
						: category.name.includes("ワークフロー")
							? "workflow"
							: category.name.includes("プロジェクト")
								? "project"
								: "";

			let categoryTemplates: QuestionTemplate[] = [];
			if (categoryKey) {
				const { data: templates, error: templatesError } = await supabase
					.from("question_templates")
					.select("*")
					.eq("category", categoryKey)
					.order("position", { ascending: true });

				if (!templatesError && templates) {
					categoryTemplates = templates as QuestionTemplate[];
				}
			}

			// デフォルト質問があれば使用
			let defaultQuestions: string[] = [];
			if (
				category.default_questions &&
				Array.isArray(category.default_questions)
			) {
				// JSONデータから文字列配列に変換
				defaultQuestions = category.default_questions.filter(
					(q) => typeof q === "string",
				) as string[];
			}

			// 質問リストの準備
			let allQuestions: QuestionTemplate[] = [];

			// 共通テンプレートがあれば追加
			if (commonTemplates) {
				allQuestions = [...(commonTemplates as QuestionTemplate[])];
			}

			// カテゴリ別のテンプレートがあれば追加
			if (categoryTemplates.length > 0) {
				allQuestions = [...allQuestions, ...categoryTemplates];
			}

			// デフォルト質問の中で、まだテンプレートにない質問があれば追加
			if (defaultQuestions.length > 0 && allQuestions.length < 10) {
				let position =
					allQuestions.length > 0
						? Math.max(...allQuestions.map((q) => q.position || 0)) + 10
						: 100;

				for (const questionText of defaultQuestions) {
					// すでに同じ質問がないか確認
					const exists = allQuestions.some(
						(q) =>
							q.question.toLowerCase().includes(questionText.toLowerCase()) ||
							questionText.toLowerCase().includes(q.question.toLowerCase()),
					);

					if (!exists) {
						allQuestions.push({
							id: `default-${position}`,
							question: questionText,
							category: categoryKey || "custom",
							position,
							is_required: true,
							description: `${category.name}に関する質問`,
						});
						position += 10;
					}
				}
			}

			// 質問が少なすぎる場合はエラー
			if (allQuestions.length === 0) {
				throw new Error("質問テンプレートが見つかりませんでした");
			}

			// 新しい質問をDBに挿入
			const questionsToInsert = allQuestions.map((q, index) => ({
				temporary_estimate_id: context.temporaryEstimateId,
				question: q.question,
				description: q.description || null,
				position: q.position || index * 10 + 10,
				category: q.category || "custom",
				template_id:
					q.id !== undefined && !q.id.startsWith("default-") ? q.id : null,
				is_answered: false,
			}));

			const { data: insertedQuestions, error: insertError } = await supabase
				.from("temporary_estimate_questions")
				.insert(questionsToInsert)
				.select();

			if (insertError) {
				throw new Error(`質問の保存に失敗しました: ${insertError.message}`);
			}

			// 質問の一時見積りIDを更新
			await supabase
				.from("temporary_estimates")
				.update({
					status: "in_progress",
					system_category_id: context.categoryId,
					updated_at: new Date().toISOString(),
				})
				.eq("id", context.temporaryEstimateId);

			// 挿入した質問をツール返り値の形式に変換
			const formattedQuestions =
				insertedQuestions?.map((q) => ({
					id: q.id,
					question: q.question,
					category: q.category || "custom",
					position: q.position,
					is_required: true,
					template_id: q.template_id || undefined,
				})) || [];

			return {
				questions: formattedQuestions,
				questionCount: formattedQuestions.length,
			};
		} catch (error) {
			console.error("質問生成エラー:", error);
			throw error;
		}
	},
});
