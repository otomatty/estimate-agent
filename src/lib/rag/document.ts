import { MDocument } from "@mastra/rag";

/**
 * テキストをチャンクに分割する関数
 * @param text 分割するテキスト
 * @param options チャンキングオプション
 * @returns チャンクの配列
 */
export async function chunkText(
	text: string,
	options: {
		strategy?:
			| "recursive"
			| "character"
			| "token"
			| "markdown"
			| "html"
			| "json"
			| "latex";
		size?: number;
		overlap?: number;
		separator?: string;
	} = {},
) {
	const {
		strategy = "recursive",
		size = 512,
		overlap = 50,
		separator = "\n\n",
	} = options;

	// MDocument.fromTextでテキストから文書オブジェクトを作成
	const doc = MDocument.fromText(text);

	// 文書をチャンクに分割
	const chunks = await doc.chunk({
		strategy,
		size,
		overlap,
		separator,
	});

	return chunks;
}

/**
 * マークダウンをチャンクに分割する関数
 * @param markdown 分割するマークダウンテキスト
 * @param options チャンキングオプション
 * @returns チャンクの配列
 */
export async function chunkMarkdown(
	markdown: string,
	options: {
		size?: number;
		overlap?: number;
		headers?: Array<[string, string]>;
		stripHeaders?: boolean;
	} = {},
) {
	const {
		size = 512,
		overlap = 50,
		headers = [
			["#", "title"],
			["##", "section"],
		],
		stripHeaders = false,
	} = options;

	// MDocument.fromMarkdownでマークダウンから文書オブジェクトを作成
	const doc = MDocument.fromMarkdown(markdown);

	// マークダウンをチャンクに分割（マークダウン特有のオプションを使用）
	const chunks = await doc.chunk({
		strategy: "markdown",
		size,
		overlap,
		headers,
		stripHeaders,
	});

	return chunks;
}

/**
 * ドキュメントタイプに基づいて適切なチャンキング関数を選択する
 * @param content ドキュメントの内容
 * @param type ドキュメントタイプ
 * @returns チャンクの配列
 */
export async function chunkDocument(
	content: string,
	type: "text" | "markdown" | "html" | "json" = "text",
	options: Record<string, unknown> = {},
) {
	switch (type) {
		case "text":
			return await chunkText(content, options);
		case "markdown":
			return await chunkMarkdown(content, options);
		case "html": {
			const htmlDoc = MDocument.fromHTML(content);
			return await htmlDoc.chunk({
				strategy: "html",
				...options,
			});
		}
		case "json": {
			const jsonDoc = MDocument.fromJSON(content);
			return await jsonDoc.chunk({
				strategy: "json",
				...options,
			});
		}
		default:
			return await chunkText(content, options);
	}
}
