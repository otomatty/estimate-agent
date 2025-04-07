import type { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../utils/errors";
import { supabase } from "../config/supabase";

/**
 * API Keyによる認証を行うミドルウェア
 */
export const apiKeyAuth = async (
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> => {
	try {
		// ヘッダーからAPI Keyを取得
		const apiKey = req.headers["x-api-key"] as string;

		if (!apiKey) {
			throw new UnauthorizedError("API Keyが必要です");
		}

		// Supabaseでキーの検証
		const { data, error } = await supabase
			.from("api_keys")
			.select("id, user_id, is_active, permissions")
			.eq("key_value", apiKey)
			.eq("is_active", true)
			.single();

		if (error || !data) {
			throw new UnauthorizedError("無効なAPI Keyです");
		}

		// リクエストオブジェクトにAPI Keyの情報を追加
		req.apiKey = {
			id: data.id,
			userId: data.user_id,
			permissions: data.permissions,
		};

		next();
	} catch (error) {
		next(error);
	}
};

// リクエスト型拡張
declare global {
	namespace Express {
		interface Request {
			apiKey?: {
				id: string;
				userId: string;
				permissions: string[];
			};
		}
	}
}
