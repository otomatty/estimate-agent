import { supabase, generateEmbedding } from "../src/lib/embedding";
import dotenv from "dotenv";

dotenv.config(); // 環境変数をロード

async function generateProjectTemplateEmbeddings() {
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

	// プロジェクトテンプレートの取得
	const { data: templates, error } = await supabase
		.from("project_templates")
		.select("*");

	if (error) {
		console.error("テンプレート取得エラー:", error);
		return;
	}

	if (!templates || templates.length === 0) {
		console.log("エンベディングを生成するテンプレートが見つかりませんでした。");
		return;
	}

	console.log(
		`${templates.length}件のテンプレートのエンベディングを生成します`,
	);

	for (const template of templates) {
		// エンベディング用のテキストを生成
		const textToEmbed = `
      名前: ${template.name || ""}
      カテゴリ: ${template.category || ""}
      説明: ${template.description || ""}
      機能: ${JSON.stringify(template.features) || "[]"}
    `;

		console.log(`\nテンプレートID: ${template.id}`);
		console.log(`テキスト生成: ${textToEmbed.substring(0, 100)}...`); // 長すぎる場合は省略

		try {
			// エンベディングの生成
			const embedding = await generateEmbedding(textToEmbed);
			console.log(
				`エンベディング生成成功 (最初の5次元): ${embedding.slice(0, 5)}...`,
			);

			// エンベディングをデータベースに保存
			const { error: updateError } = await supabase
				.from("project_templates")
				.update({ content_embedding: embedding })
				.eq("id", template.id);

			if (updateError) {
				console.error(`テンプレート ${template.id} の更新エラー:`, updateError);
			} else {
				console.log(
					`テンプレート ${template.id} のエンベディングを更新しました`,
				);
			}
		} catch (error) {
			console.error(
				`テンプレート ${template.id} のエンベディング生成/更新中にエラー:`,
				error instanceof Error ? error.message : String(error),
			);
			// エラーが発生しても次のテンプレートへ進む
		}

		// APIレート制限を考慮して少し待機 (必要に応じて調整)
		await new Promise((resolve) => setTimeout(resolve, 1000));
	}
}

// 実行
generateProjectTemplateEmbeddings()
	.then(() => console.log("\nエンベディング生成処理完了"))
	.catch((err) => console.error("スクリプト実行中にエラーが発生しました:", err))
	.finally(() => {
		// Supabaseクライアントの接続を閉じるなどの後処理があればここに追加
	});
