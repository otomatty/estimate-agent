// APIエラーの基本クラス
export class ApiError extends Error {
	statusCode: number;
	isOperational: boolean;

	constructor(statusCode: number, message: string, isOperational = true) {
		super(message);
		this.statusCode = statusCode;
		this.isOperational = isOperational;

		Error.captureStackTrace(this, this.constructor);
	}
}

// 400: Bad Request
export class BadRequestError extends ApiError {
	constructor(message = "不正なリクエストです") {
		super(400, message);
	}
}

// 401: Unauthorized
export class UnauthorizedError extends ApiError {
	constructor(message = "認証が必要です") {
		super(401, message);
	}
}

// 403: Forbidden
export class ForbiddenError extends ApiError {
	constructor(message = "アクセス権限がありません") {
		super(403, message);
	}
}

// 404: Not Found
export class NotFoundError extends ApiError {
	constructor(message = "リソースが見つかりません") {
		super(404, message);
	}
}

// 429: Too Many Requests
export class TooManyRequestsError extends ApiError {
	constructor(message = "リクエスト回数の制限を超えました") {
		super(429, message);
	}
}

// 500: Internal Server Error
export class InternalServerError extends ApiError {
	constructor(message = "サーバー内部エラーが発生しました") {
		super(500, message, false);
	}
}
