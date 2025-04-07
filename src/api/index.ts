import express from "express";
import cors from "cors";
import helmet from "helmet";
import { fileURLToPath } from "node:url";
import { env } from "./config/env";
import { apiRateLimiter } from "./middleware/rate-limit";
import { versionDetector } from "./middleware/versioning";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import compression from "compression";
import morgan from "morgan";
import dotenv from "dotenv";
import v1Routes from "./routes/v1";

// ToDo: APIルートをインポート
// import { v1Routes } from './routes/v1';

// 環境変数の設定
dotenv.config({
	path: process.env.NODE_ENV === "production" ? ".env" : ".env.development",
});

// Expressアプリケーションの作成
const app = express();
const port = process.env.PORT || 3001;

// ミドルウェアの設定
app.use(helmet()); // セキュリティヘッダーの設定
app.use(cors()); // CORS設定
app.use(express.json()); // JSONリクエストボディのパース
app.use(express.urlencoded({ extended: true })); // URLエンコードされたボディのパース
app.use(compression());
app.use(morgan("dev"));

// APIバージョン検出ミドルウェア
app.use(versionDetector);

// レート制限ミドルウェア
app.use(apiRateLimiter);

// APIルートの設定
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		time: new Date().toISOString(),
		version: env.API_VERSION,
	});
});

// APIルート
app.use("/api/v1", v1Routes);

// 404エラーハンドリング - すべてのルートで一致しないものに対して
app.all("*", notFoundHandler);

// エラーハンドリングミドルウェア - 必ず最後に配置
app.use(errorHandler);

// サーバー起動
if (import.meta.url === `file://${process.argv[1]}`) {
	app.listen(port, () => {
		console.log(`🚀 サーバー起動: http://localhost:${port}`);
		console.log(`🔍 ヘルスチェック: http://localhost:${port}/api/health`);
		console.log(`🌍 環境: ${env.NODE_ENV}`);
	});
}

export default app;
