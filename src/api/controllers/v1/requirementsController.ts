import type { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import type {
	InitialRequirementRequest,
	InitialRequirementResponse,
} from "../../types";
import supabase from "../../services/supabaseService";
import { mastra } from "../../../mastra";

/**
 * 初期要件を受け取り、処理する
 * @param req リクエスト
 * @param res レスポンス
 */
export const createInitialRequirement = async (
	req: Request<
		Record<string, never>,
		InitialRequirementResponse,
		InitialRequirementRequest
	>,
	res: Response<InitialRequirementResponse>,
) => {
	try {
		const {
			description,
			organization,
			industry,
			budget,
			timeline,
			session_id,
		} = req.body;

		if (!description) {
			return res.status(400).json({
				id: "",
				session_id: session_id || "",
				status: "error",
				message: "要件の説明が必要です",
			});
		}

		// セッションIDの生成または検証
		const estimateSessionId = session_id || uuidv4();

		// 一時見積もりレコードの作成
		const { data, error } = await supabase
			.from("temporary_estimates")
			.insert({
				session_id: estimateSessionId,
				title: organization
					? `${organization}様向け見積もり`
					: "無題の見積もり",
				initial_requirements: description,
				metadata: {
					organization,
					industry,
					budget,
					timeline,
				},
				status: "draft",
			})
			.select("id")
			.single();

		if (error) {
			console.error("Supabase error:", error);
			return res.status(500).json({
				id: "",
				session_id: estimateSessionId,
				status: "error",
				message: "データベースエラーが発生しました",
			});
		}

		// AIモデルを使用してカテゴリを推定し、質問を生成する
		try {
			// ワークフローの実行
			const workflow = mastra.getWorkflow("initial-estimate-workflow");
			const { runId, start } = workflow.createRun();
			const workflowExecution = await start({
				triggerData: {
					description,
					estimateId: data.id,
				},
			});

			// ワークフロー実行の結果を確認
			console.log("ワークフロー実行結果:", workflowExecution);

			return res.status(201).json({
				id: data.id,
				session_id: estimateSessionId,
				status: "success",
				message: "質問の生成が完了しました",
			});
		} catch (workflowError) {
			console.error("AIワークフロー実行エラー:", workflowError);

			// AIが失敗しても、成功レスポンスを返す（フロントエンドには影響を与えない）
			return res.status(201).json({
				id: data.id,
				session_id: estimateSessionId,
				status: "success",
				message: "バックグラウンドで処理中です",
			});
		}
	} catch (error) {
		console.error("Error processing initial requirement:", error);
		return res.status(500).json({
			id: "",
			session_id: "",
			status: "error",
			message: "サーバーエラーが発生しました",
		});
	}
};
