import { v4 as uuidv4 } from "uuid";
import { program } from "commander";
import inquirer from "inquirer";
import ora from "ora";
import { supabase, setSessionContext } from "./supabase";
import { EstimateService } from "./services/estimate.service";
import { QuestionService } from "./services/question.service";

// サービスのインスタンス化
const estimateService = new EstimateService();
const questionService = new QuestionService();

// セッションID
let sessionId = "";

/**
 * 見積もりフローのテスト
 */
async function testEstimateFlow(): Promise<void> {
	console.log("🚀 見積もりフローテスト開始");

	try {
		// セッションID生成
		sessionId = uuidv4();
		await setSessionContext(sessionId);

		// 1. 初期見積もり作成
		await createEstimate();

		// 2. 質問テンプレート作成
		await createQuestionTemplates();

		// 3. 質問生成
		await generateQuestions();

		// 4. 質問へ回答
		await answerQuestions();

		// 5. 見積もり項目作成
		await createEstimateItems();

		// 6. 見積もり項目の選択
		await selectEstimateItems();

		// 7. 合計金額更新
		await updateTotalAmount();

		console.log("✅ 見積もりフローテスト完了！");
	} catch (error) {
		console.error("❌ テスト失敗:", error);
	}
}

/**
 * 初期見積もり作成
 */
async function createEstimate(): Promise<void> {
	const spinner = ora("初期見積もり作成中...").start();

	try {
		const estimate = await estimateService.createTemporaryEstimate({
			sessionId,
			title: "テスト見積もり",
			initialRequirements:
				"倉庫管理システムが欲しいです。在庫管理、入出荷管理、発注管理の機能が必要です。",
			description: "テスト用の見積もりです",
		});

		spinner.succeed(`初期見積もり作成成功: ID=${estimate.id}`);
	} catch (error) {
		spinner.fail("初期見積もり作成失敗");
		throw error;
	}
}

/**
 * 質問テンプレート作成 (実際のシステムでは事前に用意されているが、テスト用に作成)
 */
async function createQuestionTemplates(): Promise<void> {
	const spinner = ora("質問テンプレート作成中...").start();

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
			spinner.info("質問テンプレートは既に存在します");
			return;
		}

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

		spinner.succeed("質問テンプレート作成成功");
	} catch (error) {
		spinner.fail("質問テンプレート作成失敗");
		throw error;
	}
}

/**
 * 質問生成
 */
async function generateQuestions(): Promise<void> {
	const spinner = ora("質問生成中...").start();

	try {
		// 最新の見積もりを取得
		const estimate =
			await estimateService.getTemporaryEstimateBySessionId(sessionId);

		if (!estimate) {
			throw new Error("見積もりが見つかりません");
		}

		// 質問を生成
		const questions = await questionService.generateQuestionsFromTemplates(
			estimate.id,
			estimate.initial_requirements,
			"inventory",
		);

		spinner.succeed(`質問生成成功: ${questions.length}件`);

		// ステータス更新
		await estimateService.updateTemporaryEstimateStatus(
			estimate.id,
			"questions",
		);
	} catch (error) {
		spinner.fail("質問生成失敗");
		throw error;
	}
}

/**
 * 質問に回答
 */
async function answerQuestions(): Promise<void> {
	const spinner = ora("質問回答中...").start();

	try {
		// 最新の見積もりを取得
		const estimate =
			await estimateService.getTemporaryEstimateBySessionId(sessionId);

		if (!estimate) {
			throw new Error("見積もりが見つかりません");
		}

		// 質問を取得
		const questions = await questionService.getEstimateQuestions(estimate.id);

		// サンプル回答
		const sampleAnswers = [
			"家具や事務用品を管理します。約1000種類の商品があります。",
			"はい、商品にはバーコードを貼り付けて管理したいです。",
			"5人ほどの担当者が使う予定です。",
			"会計システムとの連携が必要です。",
		];

		// 各質問に回答
		for (let i = 0; i < questions.length; i++) {
			await questionService.answerQuestion({
				questionId: questions[i].id,
				answer: sampleAnswers[i] || "サンプル回答です",
			});
		}

		// ステータス更新
		await estimateService.updateTemporaryEstimateStatus(
			estimate.id,
			"features",
		);

		spinner.succeed("質問回答完了");
	} catch (error) {
		spinner.fail("質問回答失敗");
		throw error;
	}
}

/**
 * 見積もり項目作成
 */
async function createEstimateItems(): Promise<void> {
	const spinner = ora("見積もり項目作成中...").start();

	try {
		// 最新の見積もりを取得
		const estimate =
			await estimateService.getTemporaryEstimateBySessionId(sessionId);

		if (!estimate) {
			throw new Error("見積もりが見つかりません");
		}

		// サンプル項目
		const items = [
			{
				name: "ログイン・ユーザー管理機能",
				description: "ユーザー権限管理、プロファイル編集などの基本機能",
				quantity: 1,
				unit_price: 200000,
				is_required: true,
				complexity: "low" as const,
				estimated_hours: 40,
				is_selected: true,
				position: 0,
			},
			{
				name: "在庫管理基本機能",
				description: "商品登録、検索、在庫レベル管理、在庫履歴",
				quantity: 1,
				unit_price: 500000,
				is_required: true,
				complexity: "medium" as const,
				estimated_hours: 80,
				is_selected: true,
				position: 1,
			},
			{
				name: "バーコードスキャン機能",
				description: "バーコードリーダーによる商品登録・検索",
				quantity: 1,
				unit_price: 300000,
				is_required: false,
				complexity: "medium" as const,
				estimated_hours: 60,
				is_selected: true,
				position: 2,
			},
			{
				name: "入出荷管理機能",
				description: "入荷・出荷処理、履歴管理、帳票出力",
				quantity: 1,
				unit_price: 400000,
				is_required: true,
				complexity: "medium" as const,
				estimated_hours: 70,
				is_selected: true,
				position: 3,
			},
			{
				name: "会計システム連携機能",
				description: "指定の会計システムとのデータ連携",
				quantity: 1,
				unit_price: 350000,
				is_required: false,
				complexity: "high" as const,
				estimated_hours: 90,
				is_selected: true,
				position: 4,
			},
		];

		// 項目作成
		await estimateService.createEstimateItems(estimate.id, items);

		spinner.succeed("見積もり項目作成成功");
	} catch (error) {
		spinner.fail("見積もり項目作成失敗");
		throw error;
	}
}

/**
 * 見積もり項目選択
 */
async function selectEstimateItems(): Promise<void> {
	const spinner = ora("見積もり項目選択中...").start();

	try {
		// 最新の見積もりを取得
		const estimate =
			await estimateService.getTemporaryEstimateBySessionId(sessionId);

		if (!estimate) {
			throw new Error("見積もりが見つかりません");
		}

		// 見積もり項目を取得
		const items = await estimateService.getEstimateItems(estimate.id);

		// オプション機能を1つ選択解除（テスト用）
		const optionalItems = items.filter((item) => !item.is_required);

		if (optionalItems.length > 0) {
			const itemToDeselect = optionalItems[0];
			await estimateService.updateItemSelection({
				itemId: itemToDeselect.id,
				isSelected: false,
			});

			spinner.succeed(`項目「${itemToDeselect.name}」の選択を解除しました`);
		} else {
			spinner.info("オプション項目がないため選択変更はスキップします");
		}

		// ステータス更新
		await estimateService.updateTemporaryEstimateStatus(estimate.id, "review");
	} catch (error) {
		spinner.fail("見積もり項目選択失敗");
		throw error;
	}
}

/**
 * 合計金額更新
 */
async function updateTotalAmount(): Promise<void> {
	const spinner = ora("合計金額更新中...").start();

	try {
		// 最新の見積もりを取得
		const estimate =
			await estimateService.getTemporaryEstimateBySessionId(sessionId);

		if (!estimate) {
			throw new Error("見積もりが見つかりません");
		}

		// 合計金額更新
		const totalAmount = await estimateService.updateTotalAmount(estimate.id);

		// ステータス更新
		await estimateService.updateTemporaryEstimateStatus(
			estimate.id,
			"completed",
		);

		spinner.succeed(`合計金額更新成功: ${totalAmount.toLocaleString()}円`);

		// メールアドレスを登録
		await estimateService.saveEmail(estimate.id, "test@example.com");
		console.log("✉️  テスト用メールアドレス登録: test@example.com");
	} catch (error) {
		spinner.fail("合計金額更新失敗");
		throw error;
	}
}

/**
 * メイン実行
 */
async function main() {
	program
		.version("1.0.0")
		.description("見積もりシステムのテスト実行ツール")
		.option("-f, --flow", "見積もりフローをテスト")
		.parse(process.argv);

	const options = program.opts();

	if (options.flow) {
		await testEstimateFlow();
	} else {
		// オプションが指定されていない場合はメニューを表示
		const { action } = await inquirer.prompt([
			{
				type: "list",
				name: "action",
				message: "実行するテストを選択:",
				choices: [
					{ name: "見積もりフロー全体をテスト", value: "flow" },
					{ name: "終了", value: "exit" },
				],
			},
		]);

		if (action === "flow") {
			await testEstimateFlow();
		} else if (action === "exit") {
			console.log("テスト終了");
		}
	}
}

// プログラム実行
main().catch(console.error);
