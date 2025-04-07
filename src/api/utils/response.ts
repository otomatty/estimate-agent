import type { Response } from "express";

interface ApiSuccessResponse<T> {
	success: true;
	data: T;
	message?: string;
}

interface ApiErrorResponse {
	success: false;
	error: {
		code: number;
		message: string;
	};
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// 成功レスポンスを作成するユーティリティ関数
export const sendSuccess = <T>(
	res: Response,
	data: T,
	message?: string,
	statusCode = 200,
): Response => {
	return res.status(statusCode).json({
		success: true,
		data,
		...(message && { message }),
	});
};

// エラーレスポンスを作成するユーティリティ関数
export const sendError = (
	res: Response,
	statusCode = 500,
	message = "サーバー内部エラーが発生しました",
): Response => {
	return res.status(statusCode).json({
		success: false,
		error: {
			code: statusCode,
			message,
		},
	});
};
