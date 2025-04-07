import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors";
import { sendError } from "../utils/response";
import { env } from "../config/env";

// エラーロギング関数
const logError = (err: Error | ApiError): void => {
	console.error(`[Error] ${new Date().toISOString()}:`, {
		name: err.name,
		message: err.message,
		stack: env.NODE_ENV === "development" ? err.stack : undefined,
		statusCode: (err as ApiError).statusCode,
		isOperational: (err as ApiError).isOperational,
	});
};

// エラーハンドリングミドルウェア
export const errorHandler = (
	err: Error | ApiError,
	req: Request,
	res: Response,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	next: NextFunction,
): void => {
	// エラーログ出力
	logError(err);

	// ApiErrorの場合はそのステータスコードとメッセージを使用
	if (err instanceof ApiError) {
		sendError(res, err.statusCode, err.message);
		return;
	}

	// 未知のエラーの場合は500エラーとして処理
	const statusCode = 500;
	const message =
		env.NODE_ENV === "production"
			? "サーバー内部エラーが発生しました"
			: err.message || "サーバー内部エラーが発生しました";

	sendError(res, statusCode, message);
};

// 404エラーハンドリングミドルウェア
export const notFoundHandler = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	const message = `リクエストされたURL ${req.originalUrl} は存在しません`;
	sendError(res, 404, message);
};
