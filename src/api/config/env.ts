import { z } from "zod";
import dotenv from "dotenv";

// 適切な.envファイルを読み込む
const nodeEnv = process.env.NODE_ENV || "development";
dotenv.config({ path: `.env.${nodeEnv}` });

// 環境変数のスキーマ定義
const envSchema = z.object({
	PORT: z.string().default("3000"),
	API_VERSION: z.string().default("v1"),
	SUPABASE_URL: z.string(),
	SUPABASE_KEY: z.string(),
	POSTGRES_CONNECTION_STRING: z
		.string()
		.min(1, "POSTGRES_CONNECTION_STRING is required"),
	API_RATE_LIMIT: z.string().default("100"),
	API_RATE_LIMIT_WINDOW_MS: z.string().default("900000"), // 15分
	NODE_ENV: z
		.enum(["development", "test", "production"])
		.default("development"),
});

// 環境変数の検証と取得
const _env = envSchema.safeParse(process.env);

// 検証に失敗した場合はエラーを表示して終了
if (!_env.success) {
	console.error("❌ 無効な環境変数:");
	console.error(_env.error.format());
	throw new Error("環境変数の検証に失敗しました");
}

// 型付き環境変数をエクスポート
export const env = _env.data;
