import { v4 as uuidv4 } from "uuid";
import { program } from "commander";
import { supabase, setSessionContext } from "./supabase";
import { EstimateService } from "./services/estimate.service";
import { QuestionService } from "./services/question.service";

// サービスのインスタンス化
const estimateService = new EstimateService();
const questionService = new QuestionService();

/**
 * 見積もりシステムの機能一覧を表示
 */
function showHelp(): void {
	console.log(`
見積もりシステム CLI
====================

使用方法:
  node dist/index.js [コマンド] [オプション]

コマンド:
  setup                セットアップを実行
  list-estimates       見積もり一覧を表示
  create-estimate      新しい見積もりを作成
  test                 テストを実行 (src/test.ts を参照)

オプション:
  -h, --help           ヘルプを表示
  -s, --session [id]   セッションIDを指定
  -v, --verbose        詳細なログを表示

例:
  node dist/index.js create-estimate --session abc123
  node dist/index.js list-estimates --verbose
  `);
}

/**
 * 見積もり一覧を表示
 */
async function listEstimates(
	sessionId?: string,
	verbose = false,
): Promise<void> {
	try {
		if (sessionId) {
			// セッションIDがある場合はそのセッションの見積もりを表示
			await setSessionContext(sessionId);
			const estimate =
				await estimateService.getTemporaryEstimateBySessionId(sessionId);

			if (estimate) {
				console.log("見積もり情報:");
				console.log(`ID: ${estimate.id}`);
				console.log(`タイトル: ${estimate.title}`);
				console.log(`ステータス: ${estimate.status}`);
				console.log(
					`作成日時: ${new Date(estimate.created_at).toLocaleString()}`,
				);

				if (verbose) {
					console.log(`要件: ${estimate.initial_requirements}`);
					console.log(
						`合計金額: ${estimate.total_amount ? estimate.total_amount.toLocaleString() + "円" : "未計算"}`,
					);

					// 項目を取得
					const items = await estimateService.getEstimateItems(estimate.id);
					console.log("\n見積もり項目:");
					items.forEach((item, index) => {
						console.log(
							`${index + 1}. ${item.name} - ${item.unit_price.toLocaleString()}円 (選択: ${item.is_selected ? "はい" : "いいえ"})`,
						);
					});

					// 質問を取得
					const questions = await questionService.getEstimateQuestions(
						estimate.id,
					);
					console.log("\n質問と回答:");
					questions.forEach((q, index) => {
						console.log(`Q${index + 1}: ${q.question}`);
						console.log(`A: ${q.answer || "未回答"}`);
						console.log("---");
					});
				}
			} else {
				console.log(
					`セッションID「${sessionId}」に関連する見積もりは見つかりませんでした。`,
				);
			}
		} else {
			// セッションIDがない場合は直近の見積もりを表示
			const { data, error } = await supabase
				.from("temporary_estimates")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(5);

			if (error) {
				throw new Error(`見積もり取得エラー: ${error.message}`);
			}

			if (data && data.length > 0) {
				console.log("最近の見積もり:");
				data.forEach((estimate, index) => {
					console.log(
						`${index + 1}. ID: ${estimate.id} | タイトル: ${estimate.title} | ステータス: ${estimate.status} | セッションID: ${estimate.session_id}`,
					);
				});
			} else {
				console.log("見積もりデータがありません。");
			}
		}
	} catch (error) {
		console.error("見積もり一覧取得エラー:", error);
	}
}

/**
 * 新しい見積もりを作成
 */
async function createEstimate(options: {
	sessionId?: string;
	title?: string;
	requirements?: string;
}): Promise<void> {
	try {
		// セッションIDがない場合は生成
		const sessionId = options.sessionId || uuidv4();
		await setSessionContext(sessionId);

		// タイトルと要件を取得
		const title = options.title || "CLI経由の見積もり";
		const requirements =
			options.requirements || "簡単な見積もりテスト用の要件です。";

		// 見積もり作成
		const estimate = await estimateService.createTemporaryEstimate({
			sessionId,
			title,
			initialRequirements: requirements,
		});

		console.log("見積もりを作成しました:");
		console.log(`ID: ${estimate.id}`);
		console.log(`タイトル: ${estimate.title}`);
		console.log(`セッションID: ${sessionId}`);
		console.log("\n詳細を確認するには:");
		console.log(
			`node dist/index.js list-estimates --session ${sessionId} --verbose`,
		);
	} catch (error) {
		console.error("見積もり作成エラー:", error);
	}
}

/**
 * セットアップを実行
 */
async function setup(): Promise<void> {
	console.log("セットアップを開始します...");

	try {
		// 質問テンプレートが既に存在するか確認
		const { data: existingTemplates, error } = await supabase
			.from("question_templates")
			.select("id")
			.limit(1);

		if (error) {
			throw error;
		}

		// テンプレートが既に存在する場合はスキップ
		if (existingTemplates && existingTemplates.length > 0) {
			console.log("質問テンプレートは既に存在します。");
		} else {
			// サンプルの質問テンプレート
			const templates = [
				{
					category: "inventory",
					question: "どのような商品を管理する予定ですか？",
					description: "商品の種類、数量などの詳細を教えてください",
					position: 0,
					is_required: true,
				},
				{
					category: "inventory",
					question: "在庫管理でバーコードなどを使用する予定はありますか？",
					description: "バーコードリーダーなどの入力方法について教えてください",
					position: 1,
					is_required: true,
				},
				{
					category: "inventory",
					question: "管理者は何人くらいを想定していますか？",
					description: "同時に利用するユーザー数を教えてください",
					position: 2,
					is_required: true,
				},
				{
					category: "inventory",
					question: "他のシステムとの連携は必要ですか？",
					description:
						"会計システム、ECサイトなど連携が必要なシステムがあれば教えてください",
					position: 3,
					is_required: false,
				},
			];

			// テンプレート作成
			const { error: insertError } = await supabase
				.from("question_templates")
				.insert(templates);

			if (insertError) {
				throw insertError;
			}

			console.log("質問テンプレートを作成しました。");
		}

		console.log("セットアップが完了しました。");
	} catch (error) {
		console.error("セットアップエラー:", error);
	}
}

/**
 * メイン実行
 */
async function main() {
	program
		.version("1.0.0")
		.description("見積もりシステムCLI")
		.option("-s, --session <id>", "セッションIDを指定")
		.option("-v, --verbose", "詳細表示", false);

	program
		.command("help")
		.description("ヘルプを表示")
		.action(() => {
			showHelp();
		});

	program
		.command("setup")
		.description("セットアップを実行")
		.action(() => {
			setup();
		});

	program
		.command("list-estimates")
		.description("見積もり一覧を表示")
		.action(() => {
			const options = program.opts();
			listEstimates(options.session, options.verbose);
		});

	program
		.command("create-estimate")
		.description("新しい見積もりを作成")
		.option("-t, --title <title>", "見積もりタイトル")
		.option("-r, --requirements <text>", "要件テキスト")
		.action((cmdOptions) => {
			const options = program.opts();
			createEstimate({
				sessionId: options.session,
				title: cmdOptions.title,
				requirements: cmdOptions.requirements,
			});
		});

	program
		.command("test")
		.description("テストを実行 (src/test.ts を参照)")
		.action(() => {
			console.log("テストを実行するには:");
			console.log("npm run test");
			process.exit(0);
		});

	// コマンドがない場合はヘルプを表示
	if (process.argv.length <= 2) {
		showHelp();
		process.exit(0);
	}

	program.parse(process.argv);
}

// プログラム実行
main().catch(console.error);
