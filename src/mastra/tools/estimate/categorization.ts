import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import supabase from "../../../api/services/supabaseService";

export const estimateCategoryTool = createTool({
	id: "estimate-category",
	description: "初期要件の説明からシステムカテゴリを推定するツール",
	inputSchema: z.object({
		description: z.string().describe("システム要件の説明文"),
	}),
	outputSchema: z.object({
		categoryId: z.string().describe("推定されたシステムカテゴリのID"),
		categoryName: z.string().describe("推定されたシステムカテゴリの名前"),
		confidence: z.number().describe("推定の確信度（0.0〜1.0）"),
		keywords: z.array(z.string()).describe("検出されたキーワード"),
	}),
	execute: async ({ context }) => {
		try {
			// Supabaseからすべてのシステムカテゴリを取得
			const { data: categories, error } = await supabase
				.from("system_categories")
				.select("*");

			if (error) {
				throw new Error(
					`システムカテゴリの取得に失敗しました: ${error.message}`,
				);
			}

			if (!categories?.length) {
				throw new Error("システムカテゴリが登録されていません");
			}

			// 各カテゴリのキーワードをチェックして、記述に最も適合するカテゴリを見つける
			const results = categories.map((category) => {
				const keywordsJson = category.keywords || [];
				let matchCount = 0;
				const matchedKeywords: string[] = [];

				// キーワード配列を適切に処理
				const keywords = Array.isArray(keywordsJson) ? keywordsJson : [];

				// 各キーワードについて、説明テキスト内での出現をチェック
				for (const keyword of keywords) {
					if (typeof keyword === "string") {
						const regex = new RegExp(keyword, "i");
						if (regex.test(context.description)) {
							matchCount++;
							matchedKeywords.push(keyword);
						}
					}
				}

				// カテゴリ名自体もチェック
				const categoryRegex = new RegExp(category.name, "i");
				if (categoryRegex.test(context.description)) {
					matchCount += 2; // カテゴリ名の一致は重み付けを高くする
					matchedKeywords.push(category.name);
				}

				// カテゴリの説明もチェック
				if (category.description) {
					const descRegex = new RegExp(
						category.description.split("、")[0],
						"i",
					);
					if (descRegex.test(context.description)) {
						matchCount++;
					}
				}

				// 確信度を計算（0〜1の範囲）
				// キーワード数に基づいて正規化
				const totalKeywords = keywords.length + 3; // カテゴリ名と説明の重みを加える
				const confidence = Math.min(matchCount / totalKeywords, 1);

				return {
					categoryId: category.id,
					categoryName: category.name,
					confidence,
					keywords: matchedKeywords,
					matchCount,
				};
			});

			// 確信度で並べ替えて最も一致度の高いカテゴリを選択
			results.sort((a, b) => b.confidence - a.confidence);
			const bestMatch = results[0];

			// 最低限の確信度（0.1）を確保
			if (bestMatch.confidence < 0.1 && bestMatch.matchCount === 0) {
				// デフォルトカテゴリを検索
				const defaultCategory =
					categories.find((c) => c.name.includes("顧客管理")) || categories[0];
				return {
					categoryId: defaultCategory.id,
					categoryName: defaultCategory.name,
					confidence: 0.1,
					keywords: [],
				};
			}

			return {
				categoryId: bestMatch.categoryId,
				categoryName: bestMatch.categoryName,
				confidence: bestMatch.confidence,
				keywords: bestMatch.keywords,
			};
		} catch (error) {
			console.error("カテゴリ推定エラー:", error);
			throw error;
		}
	},
});
