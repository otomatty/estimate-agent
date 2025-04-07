import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger";
import { PgVector } from "@mastra/pg";
import { env } from "../api/config/env"; // .env を読むためのヘルパーを流用
import { createRagAgent } from "../lib/rag"; // createRagAgent をインポート
// import { createRagAgent } from "../lib/rag"; // 必要に応じてエージェントをここで登録する場合

// PgVector インスタンスを作成
// 接続文字列がない場合のエラーハンドリングを追加した方がより堅牢
if (!env.POSTGRES_CONNECTION_STRING) {
	throw new Error("環境変数 POSTGRES_CONNECTION_STRING が設定されていません。");
}
const pgVectorStore = new PgVector(env.POSTGRES_CONNECTION_STRING);

// RAGエージェントを作成
const ragAgentInstance = createRagAgent();

// Mastra インスタンスを作成し、ベクトルストアとエージェントを登録
export const mastra = new Mastra({
	vectors: {
		// このキー 'pgVector' が createVectorQueryTool で指定した vectorStoreName と一致する必要がある
		pgVector: pgVectorStore,
	},
	agents: {
		// このキー 'ragAgent' で後でエージェントを取得する
		ragAgent: ragAgentInstance,
	},
	// ★★★ ロガーレベルを 'info' に戻す ★★★
	logger: createLogger({
		name: "MastraApp",
		level: "info", // debug から info へ
	}),
	// 必要に応じて他の設定を追加
	// logger: createLogger({ level: 'info' }),
	// agents: { ragAgent: createRagAgent() }, // エージェントをここで登録する場合
});

// console.log は削除してもいいかも
// console.log("Mastra instance created with pgVector store, RAG agent, and INFO logger registered.");

// アプリケーション終了時に接続を切断するための処理を追加すると良い
// process.on('SIGINT', async () => {
//   await pgVectorStore.disconnect();
//   process.exit();
// });
