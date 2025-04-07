import { Agent } from "@mastra/core/agent";
// import { createVectorQueryTool } from "@mastra/rag"; // 不要に
import { google } from "@ai-sdk/google";
import { mastra } from "../../mastra";
import { z } from "zod"; // Zod をインポート
// import { tool } from "@mastra/core"; // tool ヘルパーは使わない
import { chunkDocument } from "./document";
import {
	ensureIndex,
	storeChunks,
	searchSimilarChunks, // これは getRelevantContext で使われる
	EMBEDDING_DIMENSION,
	// getVectorStore, // Mastra を使うので不要に
} from "./vector-store";
import type { PgVector } from "@mastra/pg"; // ★★★ type インポートに修正 ★★★

// --- VectorQueryTool の代わりになるカスタムツール --- //

// QueryResult インターフェースを定義
interface QueryResult {
	id: string;
	score: number;
	metadata?: Record<string, unknown>;
	vector?: number[];
}

// カスタムツールの引数スキーマ (describe は削除)
const vectorSearchSchema = z.object({
	queryText: z.string(),
	topK: z.number().optional().default(5),
	filter: z.record(z.string(), z.any()).optional(),
	indexName: z.string().optional().default("requirements_embeddings"),
});

// ★★★ スキーマから型を推論 ★★★
type VectorSearchParams = z.infer<typeof vectorSearchSchema>;

// ★★★ カスタムツールをただのオブジェクトとして定義 (プロパティ名修正) ★★★
const customPgVectorSearchTool = {
	// name は Agent の tools オブジェクトのキーになるので不要かも？ 一旦残す
	// name: "customPgVectorSearchTool",
	description:
		"PostgreSQLのベクトルストアから関連ドキュメントを検索します。ユーザーの質問に答えるために必要な情報を取得するために使ってください。",
	// ★★★ argsSchema -> parameters ★★★
	parameters: vectorSearchSchema,
	// ★★★ impl -> execute ★★★
	execute: async ({
		queryText,
		topK,
		filter,
		indexName,
	}: VectorSearchParams): Promise<
		{ relevantContext: string } | { error: string }
	> => {
		try {
			const store: PgVector | undefined = mastra.getVector("pgVector");
			if (!store || typeof store.query !== "function") {
				throw new Error("MastraからpgVectorストアを取得できませんでした。");
			}

			let queryVector: number[];
			try {
				const embedResult = await google
					.textEmbeddingModel("text-embedding-004")
					.doEmbed({ values: [queryText] });
				if (
					!embedResult ||
					!embedResult.embeddings ||
					embedResult.embeddings.length === 0
				) {
					throw new Error("Embedding generation returned empty result.");
				}
				queryVector = embedResult.embeddings[0];
			} catch (embeddingError) {
				console.error("Embedding generation failed:", embeddingError);
				throw new Error("クエリのベクトル化に失敗しました。");
			}

			const results: QueryResult[] = await store.query({
				indexName,
				queryVector,
				topK,
				filter,
			});

			const relevantContext: string =
				results.length > 0
					? results
							.map((r: QueryResult) => r.metadata?.text || "")
							.filter(Boolean)
							.join("\n\n")
					: "関連情報が見つかりませんでした。";

			return { relevantContext };
		} catch (error) {
			console.error("customPgVectorSearchTool.execute Error:", error);
			return {
				error:
					error instanceof Error
						? error.message
						: "ツール実行中に不明なエラーが発生しました。",
			};
		}
	},
};

// ---------------------------------------------- //

// createRagVectorQueryTool は削除

/**
 * RAG用のエージェントを初期化する
 * @param instructions エージェントへの指示
 * @param toolOptions (現在は未使用だが互換性のため残す)
 * @returns 初期化されたエージェント
 */
export function createRagAgent(
	instructions = "",
	toolOptions: { indexName?: string } = {},
): Agent {
	// Vector Query Tool は削除し、カスタムツールを使う
	// const vectorQueryTool = createRagVectorQueryTool(indexName);

	// ★★★ フィルターに関する指示を追加 ★★★
	const simplifiedInstructions = `
あなたはユーザーの質問に答えるアシスタントです。
ユーザーからの質問に答えるために、必ず customPgVectorSearchTool を使用して関連情報を検索してください。

【重要】ユーザーが検索対象を絞り込むためのフィルター条件（例: 特定のソース、ドキュメントID、日付範囲など）を指定している場合は、それを解釈し、customPgVectorSearchTool の 'filter' 引数に { "キー": "値" } の形式で指定してください。例えば、「ソースXからの情報について教えて」という質問なら、filter: { "source": "X" } のように指定します。

検索結果に基づいて、簡潔かつ正確に回答してください。
情報が見つからない場合は、その旨を正直に伝えてください。

${instructions}`;

	return new Agent({
		name: "EstimateRagAgent",
		model: google("gemini-1.5-pro-latest"), // 安定版に戻す
		instructions: simplifiedInstructions,
		// ★★★ カスタムツールを渡す ★★★
		tools: { customPgVectorSearchTool },
	});
}

/**
 * ドキュメントを処理してベクトルデータベースに保存する
 * @param content ドキュメントの内容
 * @param docType ドキュメントタイプ
 * @param metadata メタデータ
 * @param indexName インデックス名
 */
export async function processAndStoreDocument(
	content: string,
	docType: "text" | "markdown" | "html" | "json" = "text",
	metadata: Record<string, unknown> = {},
	indexName = "requirements_embeddings",
): Promise<void> {
	// インデックスが存在することを確認
	await ensureIndex(indexName);

	// ドキュメントをチャンクに分割
	const chunks = await chunkDocument(content, docType);

	// 各チャンクにメタデータを付与
	const chunksWithMetadata = chunks.map(() => metadata);

	// チャンクをベクトルデータベースに保存
	await storeChunks(chunks, chunksWithMetadata, indexName);

	return;
}

/**
 * ユーザーの質問に関連するコンテキストを取得する
 * (この関数は generateRagResponse のデバッグログで呼び出される)
 * @param query ユーザークエリ
 * @param topK 取得する結果の数
 * @param filter メタデータフィルター
 * @param indexName インデックス名
 * @returns 関連するコンテキスト
 */
export async function getRelevantContext(
	query: string,
	topK = 5,
	filter: Record<string, unknown> = {},
	indexName = "requirements_embeddings",
): Promise<string> {
	// 関連するチャンクを検索
	const results = await searchSimilarChunks(query, topK, filter, indexName);

	// 結果がない場合
	if (results.length === 0) {
		return "関連情報が見つかりませんでした。";
	}

	// 検索結果からコンテキストを構築
	const context = results.map((result) => result.text).join("\n\n");

	return context;
}

/**
 * ユーザーの質問に対してRAGを使用して回答する
 * ★★★ 一時的に RAG を無効化し、単純なモデル呼び出しをテスト ★★★
 * @param query ユーザーの質問 (現在は使われない)
 * @returns 回答
 */
export async function generateRagResponse(
	query: string,
	filter: Record<string, unknown> = {},
	indexName = "requirements_embeddings",
): Promise<string> {
	// // ★★★ 関数開始ログ ★★★
	// console.log("--- generateRagResponse CALLED ---");
	// console.log("Received query:", query);
	// // ★★★ ここまで ★★★

	try {
		// // ★★★ エージェント取得ログ ★★★
		// console.log("Getting agent from mastra instance...");
		const agent = mastra.getAgent("ragAgent");
		// console.log("Agent retrieved successfully.");
		// // ★★★ ここまで ★★★

		// // ★★★ generate 呼び出し直前ログ ★★★
		// console.log("Calling agent.generate with query:", query);
		const response = await agent.generate(query);
		// console.log("agent.generate finished.");
		// // ★★★ ここまで ★★★

		// // ★★★ 応答ログ ★★★
		// console.log("Final Agent Response Text:", response.text);
		// // ★★★ ここまで ★★★
		return response.text;
	} catch (error) {
		console.error("RAG Query Error in generateRagResponse:", error); // エラーログは残す
		throw error;
	}
}
