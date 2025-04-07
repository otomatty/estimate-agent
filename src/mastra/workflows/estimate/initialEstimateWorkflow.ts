import { google } from "@ai-sdk/google";
import { Step, Workflow } from "@mastra/core/workflows";
import { z } from "zod";
import { estimateCategoryTool } from "../../tools/estimate/categorization";
import { generateQuestionsTool } from "../../tools/estimate/questionGenerator";

// モデルの設定
const llm = google("gemini-1.5-pro-latest");

// システムカテゴリ推定ステップ
const estimateCategory = new Step({
	id: "estimate-category",
	description: "初期要件からシステムカテゴリを推定するステップ",
	inputSchema: z.object({
		description: z.string().describe("システム要件の説明文"),
		estimateId: z.string().describe("一時見積もりのID"),
	}),
	execute: async ({ context }) => {
		const triggerData = context.inputData;

		if (!triggerData) {
			throw new Error("トリガーデータが見つかりません");
		}

		// ツールをインポートして直接実行
		try {
			// nullチェックを追加
			if (!estimateCategoryTool || !estimateCategoryTool.execute) {
				throw new Error("カテゴリ推定ツールが見つかりません");
			}

			const result = await estimateCategoryTool.execute({
				context: {
					description: triggerData.description,
				},
			});

			return {
				categoryId: result.categoryId,
				categoryName: result.categoryName,
				confidence: result.confidence,
				keywords: result.keywords,
				estimateId: triggerData.estimateId,
			};
		} catch (error) {
			console.error("カテゴリ推定エラー:", error);
			// デフォルト値を返す
			return {
				categoryId: "default-category",
				categoryName: "顧客管理システム (CRM)",
				confidence: 0.5,
				keywords: [],
				estimateId: triggerData.estimateId,
			};
		}
	},
});

// 質問生成ステップ
const generateQuestions = new Step({
	id: "generate-questions",
	description: "システムカテゴリに基づいて質問リストを生成するステップ",
	inputSchema: z.object({
		categoryId: z.string(),
		categoryName: z.string(),
		confidence: z.number(),
		keywords: z.array(z.string()),
		estimateId: z.string(),
	}),
	execute: async ({ context }) => {
		// 前のステップの結果を取得
		try {
			// 前のステップの結果をinputDataから取得
			const categoryData = context.inputData;

			if (!categoryData) {
				throw new Error("カテゴリデータが見つかりません");
			}

			// nullチェックを追加
			if (!generateQuestionsTool || !generateQuestionsTool.execute) {
				throw new Error("質問生成ツールが見つかりません");
			}

			const result = await generateQuestionsTool.execute({
				context: {
					categoryId: categoryData.categoryId,
					temporaryEstimateId: categoryData.estimateId,
					initialRequirements: "", // 初期要件自体は一時見積もりテーブルから取得されるため空でOK
				},
			});

			return {
				questions: result.questions,
				questionCount: result.questionCount,
				categoryName: categoryData.categoryName,
			};
		} catch (error) {
			console.error("質問生成エラー:", error);
			return {
				questions: [],
				questionCount: 0,
				categoryName: "不明なカテゴリ",
			};
		}
	},
});

// 初期見積もりワークフロー
const workflow = new Workflow({
	name: "initial-estimate-workflow",
});

// triggerSchemaを設定
workflow.triggerSchema = z.object({
	description: z.string().describe("システム要件の説明文"),
	estimateId: z.string().describe("一時見積もりのID"),
});

// ステップを設定
workflow.step(estimateCategory).then(generateQuestions);

// ワークフローをコミット
workflow.commit();

export const initialEstimateWorkflow = workflow;
