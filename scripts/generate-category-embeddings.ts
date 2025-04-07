import { supabase, generateEmbedding } from "../src/lib/embedding";
import dotenv from "dotenv";

dotenv.config(); // 環境変数をロード

async function generateCategoryEmbeddings() {
	// 環境変数のチェック
	if (
		!process.env.SUPABASE_URL ||
		!process.env.SUPABASE_ANON_KEY ||
		!process.env.GEMINI_API_KEY
	) {
		console.error(
			"必要な環境変数 (SUPABASE_URL, SUPABASE_ANON_KEY, GEMINI_API_KEY) が設定されていません。",
		);
		process.exit(1);
	}

	// システムカテゴリの取得
	const { data: categories, error } = await supabase
		.from("system_categories")
		.select("*");

	if (error) {
		console.error("カテゴリ取得エラー:", error);
		return;
	}

	if (!categories || categories.length === 0) {
		console.log("エンベディングを生成するカテゴリが見つかりませんでした。");
		return;
	}

	console.log(`${categories.length}件のカテゴリのエンベディングを生成します`);

	for (const category of categories) {
		// エンベディング用のテキストを生成
		const textToEmbed = `
      名前: ${category.name || ""}
      説明: ${category.description || ""}
      キーワード: ${JSON.stringify(category.keywords) || "[]"}
    `;

		console.log(`\nカテゴリID: ${category.id}`);
		console.log(`テキスト生成: ${textToEmbed.substring(0, 100)}...`);

		try {
			// エンベディングの生成
			const embedding = await generateEmbedding(textToEmbed);
			console.log(
				`エンベディング生成成功 (最初の5次元): ${embedding.slice(0, 5)}...`,
			);

			// エンベディングをデータベースに保存
			const { error: updateError } = await supabase
				.from("system_categories")
				.update({ content_embedding: embedding })
				.eq("id", category.id);

			if (updateError) {
				console.error(`カテゴリ ${category.id} の更新エラー:`, updateError);
			} else {
				console.log(`カテゴリ ${category.id} のエンベディングを更新しました`);
			}
		} catch (error) {
			console.error(
				`カテゴリ ${category.id} のエンベディング生成/更新中にエラー:`,
				error instanceof Error ? error.message : String(error),
			);
			// エラーが発生しても次のカテゴリへ進む
		}

		// APIレート制限を考慮して少し待機 (必要に応じて調整)
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

// 実行
generateCategoryEmbeddings()
	.then(() => console.log("\nエンベディング生成処理完了"))
	.catch((err) => console.error("スクリプト実行中にエラーが発生しました:", err))
	.finally(() => {
		// Supabaseクライアントの接続を閉じるなどの後処理があればここに追加
	});
