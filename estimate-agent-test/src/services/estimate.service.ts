import { supabase } from "../supabase";
import { v4 as uuidv4 } from "uuid";
import type {
	CreateEstimateInput,
	TemporaryEstimate,
	TemporaryEstimateItem,
	SelectEstimateItemInput,
} from "../models/types";

export class EstimateService {
	/**
	 * 新しい一時見積もりを作成する
	 */
	async createTemporaryEstimate(
		input: CreateEstimateInput,
	): Promise<TemporaryEstimate> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimates")
				.insert({
					session_id: input.sessionId,
					title: input.title,
					description: input.description || null,
					initial_requirements: input.initialRequirements,
					status: "draft",
				})
				.select()
				.single();

			if (error) {
				throw new Error(`見積もり作成エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("見積もり作成に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * セッションIDに関連する一時見積もりを取得する
	 */
	async getTemporaryEstimateBySessionId(
		sessionId: string,
	): Promise<TemporaryEstimate | null> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimates")
				.select("*")
				.eq("session_id", sessionId)
				.order("created_at", { ascending: false })
				.limit(1)
				.single();

			if (error) {
				if (error.code === "PGRST116") {
					// データが見つからない場合
					return null;
				}
				throw new Error(`見積もり取得エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("見積もり取得に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 一時見積もりのステータスを更新する
	 */
	async updateTemporaryEstimateStatus(
		estimateId: string,
		status: TemporaryEstimate["status"],
	): Promise<void> {
		try {
			const { error } = await supabase
				.from("temporary_estimates")
				.update({ status, updated_at: new Date().toISOString() })
				.eq("id", estimateId);

			if (error) {
				throw new Error(`ステータス更新エラー: ${error.message}`);
			}
		} catch (error) {
			console.error("ステータス更新に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 一時見積もりの合計金額を更新する
	 */
	async updateTotalAmount(estimateId: string): Promise<number> {
		try {
			// 選択された項目の合計金額を計算
			const { data: items, error: itemsError } = await supabase
				.from("temporary_estimate_items")
				.select("unit_price, quantity, is_selected")
				.eq("temporary_estimate_id", estimateId);

			if (itemsError) {
				throw new Error(`項目取得エラー: ${itemsError.message}`);
			}

			const totalAmount = items
				.filter((item) => item.is_selected)
				.reduce((sum, item) => sum + item.unit_price * item.quantity, 0);

			// 合計金額を更新
			const { error: updateError } = await supabase
				.from("temporary_estimates")
				.update({
					total_amount: totalAmount,
					updated_at: new Date().toISOString(),
				})
				.eq("id", estimateId);

			if (updateError) {
				throw new Error(`合計金額更新エラー: ${updateError.message}`);
			}

			return totalAmount;
		} catch (error) {
			console.error("合計金額更新に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 見積もり項目を作成する
	 */
	async createEstimateItems(
		estimateId: string,
		items: Omit<
			TemporaryEstimateItem,
			"id" | "temporary_estimate_id" | "created_at" | "updated_at"
		>[],
	): Promise<TemporaryEstimateItem[]> {
		try {
			const itemsToInsert = items.map((item, index) => ({
				...item,
				temporary_estimate_id: estimateId,
				position: index,
			}));

			const { data, error } = await supabase
				.from("temporary_estimate_items")
				.insert(itemsToInsert)
				.select();

			if (error) {
				throw new Error(`項目作成エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("項目作成に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 見積もり項目を取得する
	 */
	async getEstimateItems(estimateId: string): Promise<TemporaryEstimateItem[]> {
		try {
			const { data, error } = await supabase
				.from("temporary_estimate_items")
				.select("*")
				.eq("temporary_estimate_id", estimateId)
				.order("position", { ascending: true });

			if (error) {
				throw new Error(`項目取得エラー: ${error.message}`);
			}

			return data;
		} catch (error) {
			console.error("項目取得に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * 見積もり項目の選択状態を更新する
	 */
	async updateItemSelection(input: SelectEstimateItemInput): Promise<void> {
		try {
			const { error } = await supabase
				.from("temporary_estimate_items")
				.update({
					is_selected: input.isSelected,
					updated_at: new Date().toISOString(),
				})
				.eq("id", input.itemId);

			if (error) {
				throw new Error(`項目選択更新エラー: ${error.message}`);
			}
		} catch (error) {
			console.error("項目選択更新に失敗しました:", error);
			throw error;
		}
	}

	/**
	 * メールアドレスを保存する
	 */
	async saveEmail(estimateId: string, email: string): Promise<void> {
		try {
			const { error: updateError } = await supabase
				.from("temporary_estimates")
				.update({
					email,
					updated_at: new Date().toISOString(),
				})
				.eq("id", estimateId);

			if (updateError) {
				throw new Error(`メールアドレス保存エラー: ${updateError.message}`);
			}

			// メール通知エントリを作成
			const { error: notificationError } = await supabase
				.from("email_notifications")
				.insert({
					email,
					temporary_estimate_id: estimateId,
					status: "pending",
					content: { type: "estimate_completed" },
				});

			if (notificationError) {
				throw new Error(`メール通知作成エラー: ${notificationError.message}`);
			}
		} catch (error) {
			console.error("メールアドレス保存に失敗しました:", error);
			throw error;
		}
	}
}
