# 見積もりエージェントの実装

このドキュメントでは、Mastraフレームワークを使用した見積もりエージェントの実装方法について解説します。

## 概要

見積もりエージェントは、ユーザーからの要件入力に基づいて、業務システム開発の自動見積もりを生成するAIエージェントです。RAG (Retrieval-Augmented Generation) を活用し、ベクトルデータベースに保存されたドキュメントを参照して回答を生成することも可能です。

1. 初期要件の解析
2. 追加質問の生成と回答の処理
3. システムカテゴリの特定
4. 過去の類似案件からの参照 (RAG機能)
5. 見積もり生成と調整
6. PDF見積書の出力

## 前提条件

- Node.js v20以上
- Supabaseアカウント (データベースとして使用、pgvector拡張有効)
- Gemini API キー (LLMおよびエンベディングモデルとして使用)
- PostgreSQL 接続文字列 (`.env` に設定)

## エージェントの基本実装 (RAGエージェント例)

現在実装されているRAG (Retrieval-Augmented Generation) エージェントの例を以下に示します。これはベクトルデータベースから関連情報を検索するツールを持っています。

```typescript
// src/lib/rag/index.ts (createRagAgent 関数の内容を反映)
import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { customPgVectorSearchTool } from './customTool'; // 仮のインポートパス、実際は同ファイル内で定義

export function createRagAgent(instructions = ""): Agent {
  const simplifiedInstructions = `
あなたはユーザーの質問に答えるアシスタントです。
ユーザーからの質問に答えるために、必ず customPgVectorSearchTool を使用して関連情報を検索してください。
【重要】ユーザーが検索対象を絞り込むためのフィルター条件（例: 特定のソース、ドキュメントID、日付範囲など）を指定している場合は、それを解釈し、customPgVectorSearchTool の 'filter' 引数に { "キー": "値" } の形式で指定してください。例えば、「ソースXからの情報について教えて」という質問なら、filter: { "source": "X" } のように指定します。
検索結果に基づいて、簡潔かつ正確に回答してください。
情報が見つからない場合は、その旨を正直に伝えてください。
${instructions}`;

  return new Agent({
    name: 'EstimateRagAgent',
    // model: google('gemini-2.5-pro-preview-03-25'), // 実験的モデルから安定版へ変更
    model: google('gemini-1.5-pro-latest'),
    instructions: simplifiedInstructions,
    // 現在はカスタムベクトル検索ツールのみを持つ
    tools: { customPgVectorSearchTool },
    // 他のツール (analyzeRequirementsToolなど) は別途定義・追加が必要
  });
}
```

## ツールの実装例

エージェントが使用するツールは、特定のタスクを実行します。以下はRAG機能で使用しているカスタムベクトル検索ツールの実装例です。

### RAG用カスタムベクトル検索ツール

`@mastra/rag` の `createVectorQueryTool` の代わりに、`Mastra` クラスに登録された `PgVector` インスタンスを直接利用するカスタムツールを実装しました。

```typescript
// src/lib/rag/index.ts (customPgVectorSearchTool の実装)
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { mastra } from "../../mastra"; // Mastraインスタンスをインポート
import type { PgVector } from "@mastra/pg";

// 検索結果の型 (store.queryの戻り値に合わせる)
interface QueryResult {
  id: string;
  score: number;
  metadata?: Record<string, any>; // metadataはオプショナル
  vector?: number[];
}

// カスタムツールの引数スキーマ
const vectorSearchSchema = z.object({
  queryText: z.string(),
  topK: z.number().optional().default(5),
  filter: z.record(z.string(), z.any()).optional(),
  indexName: z.string().optional().default("requirements_embeddings"),
});
type VectorSearchParams = z.infer<typeof vectorSearchSchema>;

// カスタムツールオブジェクト (Mastraの `tool` ヘルパーは使わない)
const customPgVectorSearchTool = {
  description: "PostgreSQLのベクトルストアから関連ドキュメントを検索します。ユーザーの質問に答えるために必要な情報を取得するために使ってください。",
  // `Agent` が期待するプロパティ名に合わせる
  parameters: vectorSearchSchema,
  execute: async ({ queryText, topK, filter, indexName }: VectorSearchParams): Promise<{ relevantContext: string } | { error: string }> => {
    try {
      // Mastra から登録済みの PgVector ストアを取得
      const store: PgVector | undefined = mastra.getVector('pgVector');
      if (!store || typeof store.query !== 'function') {
        throw new Error("MastraからpgVectorストアを取得できませんでした。");
      }

      // クエリのエンベディング生成 (doEmbedを使用)
      let queryVector: number[];
      try {
        const embedResult = await google.textEmbeddingModel("text-embedding-004").doEmbed({ values: [queryText] });
        if (!embedResult?.embeddings?.[0]) { // 結果を安全にチェック
          throw new Error("Embedding generation returned empty result.");
        }
        queryVector = embedResult.embeddings[0];
      } catch (embeddingError) {
        console.error("Embedding generation failed:", embeddingError);
        throw new Error("クエリのベクトル化に失敗しました。");
      }

      // ベクトル検索実行
      const results: QueryResult[] = await store.query({
        indexName,
        queryVector,
        topK,
        filter,
      });

      // 結果を整形してコンテキスト文字列を作成
      const relevantContext: string = results.length > 0
        ? results.map((r: QueryResult) => r.metadata?.text || "").filter(Boolean).join("\n\n")
        : "関連情報が見つかりませんでした。";

      return { relevantContext }; // エージェントには検索結果のコンテキストを返す

    } catch (error) {
      console.error("customPgVectorSearchTool.execute Error:", error);
      return { error: error instanceof Error ? error.message : "ツール実行中に不明なエラーが発生しました。" };
    }
  },
};
```

**(注意)** 上記はRAG機能に特化したツールの例です。元のドキュメントにあった他のツール (`analyzeRequirementsTool`, `generateQuestionsTool` など) は、見積もりプロセス全体を実装する際に別途必要となります。これらのツールも、`createTool` ヘルパーを使わずにカスタムオブジェクト形式で実装するか、あるいはMastraのツール仕様に合わせて実装する必要があります。

## ワークフロー実装

上記のツールを組み合わせて見積もりワークフローを構築することも可能です。以下は見積もりプロセス全体の自動化を目指す場合のワークフロー例です。

**(注意)** 現在のRAG実装 (`generateRagResponse` 関数) は、APIから直接エージェントを呼び出すシンプルな形式であり、以下のワークフローとは異なります。このワークフロー例は、より複雑な複数ステップの自動化プロセスを構築する際の参考としてください。

```typescript
// src/mastra/workflows/estimateWorkflow.ts (参考例)
import { workflow } from '@mastra/core/workflow';
import { z } from 'zod';

export const estimateWorkflow = workflow({
  id: 'estimate-workflow',
  title: '見積もりワークフロー',
  description: '業務システム開発の自動見積もりを生成します',

  input: z.object({ /* ... */ }),
  output: z.object({ /* ... */ }),
  steps: [
    { id: 'analyze-requirements', /* ... */ },
    { id: 'gather-information', /* ... */ },
    // gather-information ステップ内でRAGツール(customPgVectorSearchTool)を呼び出すなどが考えられる
    { id: 'find-similar-projects', /* ... (これもベクトル検索を使うかもしれない) */ },
    { id: 'generate-estimate', /* ... */ },
    { id: 'generate-pdf', /* ... */ },
  ],
});
```

## Mastraインスタンスへの登録

`src/mastra/index.ts` で `Mastra` クラスを初期化し、ベクトルストアやエージェントを登録します。これにより、エージェントは登録されたツールやベクトルストアを利用できるようになります。

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core";
import { createLogger } from "@mastra/core/logger"; // createLogger をインポート
import { PgVector } from "@mastra/pg";
import { env } from "../api/config/env";
import { createRagAgent } from "../lib/rag"; // RAGエージェント作成関数をインポート

// PgVector インスタンスを作成
if (!env.POSTGRES_CONNECTION_STRING) {
  throw new Error("環境変数 POSTGRES_CONNECTION_STRING が設定されていません。");
}
const pgVectorStore = new PgVector(env.POSTGRES_CONNECTION_STRING);

// RAGエージェントを作成
const ragAgentInstance = createRagAgent();

// Mastra インスタンスを作成し、ベクトルストアとエージェントを登録
export const mastra = new Mastra({
  vectors: {
    // キー 'pgVector' で PgVector インスタンスを登録
    // このキーはカスタムツール内で mastra.getVector('pgVector') として参照される
    pgVector: pgVectorStore,
  },
  agents: {
    // キー 'ragAgent' で RAG エージェントインスタンスを登録
    // APIなどからは mastra.getAgent('ragAgent') で取得できる
    ragAgent: ragAgentInstance,
  },
  logger: createLogger({
    name: "MastraApp",
    level: "info", // 通常運用時は 'info' レベルを推奨
  }),
  // tools: { ... } // カスタムツールはエージェントに直接渡すため、ここでの登録は不要
  // workflows: { estimateWorkflow }, // ワークフローを使う場合はここで登録
});

console.log("Mastra instance created and configured.");
```

## まとめ

このドキュメントでは、Mastraフレームワークを使用した見積もりエージェントの基本的な実装、特にRAG機能周りの現在の実装方法について解説しました。

1. AIエージェント(`Agent`)の定義と指示(`instructions`)の設計
2. カスタムツール(`customPgVectorSearchTool`)によるベクトル検索の実装
3. `Mastra`クラスへのベクトルストア(`PgVector`)とエージェントの登録による連携
4. (参考) ワークフローによる複数ステッププロセスの自動化

これらの実装により、ユーザーの質問に対して関連ドキュメントを参照し、より文脈に合った回答を生成するRAG機能の基盤が構築できました。 