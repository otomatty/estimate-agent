import { PgVector } from "@mastra/pg";
import { generateEmbedding } from "../embedding";

// PostgreSQLコネクションを環境変数から取得
const CONNECTION_STRING = process.env.POSTGRES_CONNECTION_STRING || "";

// ベクトルの次元数 (Gemini text-embedding-004 は 768次元)
export const EMBEDDING_DIMENSION = 768;

// PgVectorインスタンスを初期化
let vectorStore: PgVector | null = null;

/**
 * PgVectorインスタンスを取得または初期化する関数
 * @returns 初期化されたPgVectorインスタンス
 */
export function getVectorStore(): PgVector {
	if (!vectorStore) {
		if (!CONNECTION_STRING) {
			throw new Error(
				"環境変数 POSTGRES_CONNECTION_STRING が設定されていません",
			);
		}

		vectorStore = new PgVector(CONNECTION_STRING);
	}

	return vectorStore;
}

/**
 * ベクトルインデックスが存在するか確認し、存在しない場合は作成する
 * @param indexName インデックス名
 * @returns 作成または取得したインデックスの情報
 */
export async function ensureIndex(
	indexName = "requirements_embeddings",
): Promise<void> {
	const store = getVectorStore();

	try {
		// インデックスが存在するか確認
		await store.describeIndex(indexName);
		console.log(`インデックス '${indexName}' はすでに存在します`);
	} catch (error) {
		// インデックスが存在しない場合は作成
		console.log(`インデックス '${indexName}' を作成します`);
		await store.createIndex({
			indexName,
			dimension: EMBEDDING_DIMENSION, // Gemini text-embedding-004 の次元数
		});
		console.log(`インデックス '${indexName}' を作成しました`);
	}
}

/**
 * テキストチャンクをベクトルデータベースに保存する
 * @param chunks 保存するテキストチャンク
 * @param metadata 各チャンクに関連付けるメタデータ
 * @param indexName 保存先のインデックス名
 */
export async function storeChunks(
	chunks: Array<{ text: string }>,
	metadata: Record<string, unknown>[] = [],
	indexName = "requirements_embeddings",
): Promise<void> {
	const store = getVectorStore();

	// インデックスが存在することを確認
	await ensureIndex(indexName);

	// 各チャンクに対してエンベディングを生成
	const embeddings: number[][] = [];
	for (const chunk of chunks) {
		const embedding = await generateEmbedding(chunk.text);
		embeddings.push(embedding);
	}

	// チャンクとそのメタデータを組み合わせる
	const chunkMetadata = chunks.map((chunk, index) => ({
		text: chunk.text,
		...(metadata[index] || {}),
	}));

	// ベクトルデータベースにエンベディングとメタデータを保存
	await store.upsert({
		indexName,
		vectors: embeddings,
		metadata: chunkMetadata,
	});

	console.log(
		`${chunks.length} チャンクをインデックス '${indexName}' に保存しました`,
	);
}

/**
 * クエリテキストから関連するチャンクを検索する
 * @param queryText 検索クエリテキスト
 * @param topK 取得する結果の最大数
 * @param filter メタデータフィルター
 * @param indexName 検索対象のインデックス名
 * @returns 検索結果の配列
 */
export async function searchSimilarChunks(
	queryText: string,
	topK = 5,
	filter: Record<string, unknown> = {},
	indexName = "requirements_embeddings",
): Promise<
	Array<{
		text: string;
		score: number;
		metadata: Record<string, unknown>;
	}>
> {
	const store = getVectorStore();

	// クエリテキストのエンベディングを生成
	const queryVector = await generateEmbedding(queryText);

	// ベクトルデータベースを検索
	const results = await store.query({
		indexName,
		queryVector,
		topK,
		filter,
	});

	// 結果を整形して返す
	return results.map((result) => ({
		text: result.metadata?.text || "",
		score: result.score,
		metadata: result.metadata || {},
	}));
}
