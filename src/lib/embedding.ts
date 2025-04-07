import { createClient } from "@supabase/supabase-js";

// Supabaseクライアントの初期化
export const supabase = createClient(
	process.env.SUPABASE_URL as string,
	process.env.SUPABASE_ANON_KEY as string,
);

/**
 * テキストからエンベディングを生成する関数
 * @param text エンベディングを生成するテキスト
 * @returns エンベディングベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
	const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

	if (!GEMINI_API_KEY) {
		throw new Error("環境変数 GEMINI_API_KEY が設定されていません");
	}

	const modelName = "models/text-embedding-004"; // 使用するモデル名を変更
	const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:embedContent?key=${GEMINI_API_KEY}`;

	try {
		const response = await fetch(apiUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: modelName,
				content: {
					parts: [{ text }],
				},
				// text-embedding-004 は taskType をサポートしていない可能性があるためコメントアウト
				// taskType: 'SEMANTIC_SIMILARITY'
			}),
		});

		const data = await response.json();

		if (!response.ok) {
			console.error("Gemini API エラーレスポンス:", data);
			throw new Error(
				`エンベディング生成APIエラー: ${response.status} ${response.statusText}`,
			);
		}

		if (!data.embedding || !data.embedding.values) {
			console.error("無効なエンベディングデータ:", data);
			throw new Error(
				"エンベディングの生成に失敗しました。APIレスポンスの形式が不正です。",
			);
		}

		return data.embedding.values;
	} catch (error) {
		console.error("エンベディング生成中に予期せぬエラー:", error);
		// エラーオブジェクトが Error インスタンスでない場合も考慮
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`エンベディング生成に失敗: ${message}`);
	}
}
