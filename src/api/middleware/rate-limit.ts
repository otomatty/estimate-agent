import rateLimit from "express-rate-limit";
import { env } from "../config/env";
import { TooManyRequestsError } from "../utils/errors";

// レート制限の設定値
const MAX_REQUESTS = Number.parseInt(env.API_RATE_LIMIT, 10);
const WINDOW_MS = Number.parseInt(env.API_RATE_LIMIT_WINDOW_MS, 10);

// レート制限ミドルウェアの作成
export const apiRateLimiter = rateLimit({
	windowMs: WINDOW_MS, // 15分
	max: MAX_REQUESTS, // 15分間に最大リクエスト数
	standardHeaders: true, // レート制限情報をヘッダーに含める
	legacyHeaders: false,
	message:
		"リクエスト回数の上限に達しました。しばらく経ってから再試行してください。",
	handler: (req, res, next, options) => {
		next(new TooManyRequestsError(options.message as string));
	},
	// APIキーごとにリクエスト回数を管理
	keyGenerator: (req) => {
		const apiKey = req.headers["x-api-key"] as string;
		return apiKey || req.ip || "unknown-user";
	},
});
