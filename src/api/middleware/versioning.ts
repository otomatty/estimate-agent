import type { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/errors";
import { env } from "../config/env";

// サポートするAPIバージョンの一覧
const SUPPORTED_VERSIONS = ["v1"];
const DEFAULT_VERSION = env.API_VERSION;

// APIバージョン検出ミドルウェア
export const versionDetector = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	try {
		// URLパスからバージョンを取得 (例: /api/v1/...)
		const urlParts = req.path.split("/");
		const versionIndex = urlParts.findIndex((part) => part.match(/^v\d+$/));

		// URLパスからバージョンが見つかった場合
		if (versionIndex !== -1) {
			const version = urlParts[versionIndex];

			if (!SUPPORTED_VERSIONS.includes(version)) {
				throw new BadRequestError(
					`APIバージョン ${version} はサポートされていません`,
				);
			}

			req.apiVersion = version;
			next();
			return;
		}

		// ヘッダーからバージョンを取得
		const headerVersion = req.get("X-API-Version");

		if (headerVersion) {
			if (!SUPPORTED_VERSIONS.includes(headerVersion)) {
				throw new BadRequestError(
					`APIバージョン ${headerVersion} はサポートされていません`,
				);
			}

			req.apiVersion = headerVersion;
			next();
			return;
		}

		// デフォルトバージョンを使用
		req.apiVersion = DEFAULT_VERSION;
		next();
	} catch (error) {
		next(error);
	}
};

// リクエスト型拡張
declare global {
	namespace Express {
		interface Request {
			apiVersion?: string;
		}
	}
}
