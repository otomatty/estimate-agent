# エンベディング機能の実装

このドキュメントでは、見積もりシステムにおけるエンベディング機能の実装方法について解説します。エンベディングは、テキストデータをベクトル形式に変換し、意味的な類似性検索を可能にする技術です。

## 概要

見積もりシステムにおけるエンベディングの主な用途は以下の通りです：

1.  RAG (Retrieval-Augmented Generation): 入力されたクエリや要件に基づいて、関連するドキュメント（過去のプロジェクトテンプレート、システムカテゴリ情報など）をベクトルデータベースから検索し、その情報を基に回答を生成する。

Gemini APIの`text-embedding-004`モデルを使用して、テキストデータを768次元のベクトル形式に変換し、Supabase PostgreSQLのpgvector拡張を利用して類似性検索を行います。`ivfflat`インデックスを使用します。

## 前提条件

- Node.js v20以上
- Supabase (pgvector拡張が有効)
- Gemini API キー
- PostgreSQL 接続文字列 (`.env` に設定)

## 実装手順

### 1. 必要なパッケージのインストール

```bash
# Supabase クライアントと Mastra 関連パッケージ
bun add @supabase/supabase-js @mastra/core @mastra/pg @ai-sdk/google zod
```

### 2. Supabase セットアップ

まず、Supabaseでpgvector拡張を有効にします。

```sql
-- Supabaseコンソールのエディタから実行
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. エンベディング生成用関数の実装 (参考)

**(注意)** 以下の `generateEmbedding` 関数は、現在のRAG実装 (`customPgVectorSearchTool` 内) では**直接使用されていません**。実際のエンベディング生成は、カスタムツール内で `@ai-sdk/google` ライブラリの `google.textEmbeddingModel().doEmbed()` メソッドを直接呼び出す形で行っています。このコード例は、Gemini APIを直接呼び出す場合の参考としてください。

```typescript
// src/lib/embedding.ts (参考例 - 現在は直接使用されていない)
import { createClient } from '@supabase/supabase-js';

// ... Supabaseクライアント初期化 ...

export async function generateEmbedding(text: string): Promise<number[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) { /* ... エラー処理 ... */ }

  // ★★★ モデル名から "models/" を削除 ★★★
  const modelName = 'text-embedding-004';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:embedContent?key=${GEMINI_API_KEY}`;

  try {
    // ... fetch API 呼び出し ...
    const data = await response.json();
    if (!response.ok) { /* ... エラー処理 ... */ }
    if (!data.embedding?.values) { /* ... エラー処理 ... */ }
    return data.embedding.values;
  } catch (error) { /* ... エラー処理 ... */ }
}
```

実際のエンベディング生成は、`@ai-sdk/google` を利用して以下のように行われます。

```typescript
// カスタムツール内でのエンベディング生成例 (src/lib/rag/index.ts より)
import { google } from "@ai-sdk/google";

async function getEmbeddingForQuery(queryText: string): Promise<number[]> {
  try {
    const embedResult = await google.textEmbeddingModel("text-embedding-004")
                                  .doEmbed({ values: [queryText] }); // 引数は配列で渡す
    if (!embedResult?.embeddings?.[0]) { 
      throw new Error("Embedding generation returned empty result.");
    }
    return embedResult.embeddings[0]; // 結果から配列を取り出す
  } catch (embeddingError) {
    console.error("Embedding generation failed:", embeddingError);
    throw new Error("クエリのベクトル化に失敗しました。");
  }
}
```

### 4. & 5. データへのエンベディング生成・保存スクリプト

プロジェクトテンプレートやシステムカテゴリなどの既存データに対して、事前にエンベディングを生成し、データベースの `vector` 型カラム (例: `content_embedding`) に保存しておく必要があります。これは通常、バッチ処理スクリプトで行います。

```typescript
// scripts/generate-embeddings.ts (基本的な流れ)
// (generateEmbedding は上記参考例か、@ai-sdk/google を使う実装に置き換え)
import { supabase, generateEmbedding } from '../src/lib/embedding';

async function generateDataEmbeddings(tableName: string) {
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) { /* ... エラー処理 ... */ return; }

  for (const item of data) {
    // 各アイテムからエンベディング対象のテキストを構築
    const textToEmbed = `/* item の内容からテキストを生成 */`;
    try {
      const embedding = await generateEmbedding(textToEmbed); // or use @ai-sdk/google
      await supabase.from(tableName)
                    .update({ content_embedding: embedding })
                    .eq('id', item.id);
      console.log(`Updated ${tableName} item ${item.id}`);
    } catch (err) {
      console.error(`Failed for ${tableName} item ${item.id}:`, err);
    }
  }
}

// 実行例
Promise.all([
  generateDataEmbeddings('project_templates'),
  generateDataEmbeddings('system_categories')
]).then(() => console.log('All embeddings generated.'))
  .catch(err => console.error('Error generating embeddings:', err));
```

### 6. PostgreSQL関数とインデックス

ベクトル検索を効率的に行うために、Supabase上で `pgvector` 拡張を使用し、適切な関数とインデックスを作成します。

```sql
-- pgvector 拡張機能の有効化 (初回のみ)
CREATE EXTENSION IF NOT EXISTS vector;

-- 類似プロジェクト検索関数 (768次元)
CREATE OR REPLACE FUNCTION match_projects( /* ... 定義は変更なし ... */ );

-- 類似カテゴリ検索関数 (768次元)
CREATE OR REPLACE FUNCTION match_categories( /* ... 定義は変更なし ... */ );

-- ivfflat インデックス作成 (768次元, cosine類似度)
-- (テーブル名とカラム名は実際のスキーマに合わせる)
CREATE INDEX IF NOT EXISTS project_templates_embedding_ivfflat_idx 
ON public.project_templates 
USING ivfflat (content_embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS system_categories_embedding_ivfflat_idx 
ON public.system_categories 
USING ivfflat (content_embedding vector_cosine_ops);
```
**(注意)** `ivfflat` インデックスは近似最近傍探索であり、100%の精度を保証するものではありません。データ量や検索要件によっては `hnsw` インデックスの方が適している場合もあります。

### 7. Mastra実装での使用例 (カスタムツール)

現在の実装では、Mastra Agent に渡すカスタムツール内でベクトル検索を実行しています。Supabase RPC を直接呼び出す代わりに、`Mastra` インスタンスに登録された `PgVector` ストアを利用します。

```typescript
// src/lib/rag/index.ts (customPgVectorSearchTool の execute 部分抜粋)
import { mastra } from "../../mastra";
import type { PgVector } from "@mastra/pg";
// ... QueryResult インターフェース、エンベディング生成処理 ...

async function executeSearch(params: VectorSearchParams): Promise<{ relevantContext: string } | { error: string }> {
  const { queryText, topK, filter, indexName } = params;
  try {
    // Mastra から PgVector ストアを取得
    const store: PgVector | undefined = mastra.getVector('pgVector');
    if (!store || typeof store.query !== 'function') {
      throw new Error("MastraからpgVectorストアを取得できませんでした。");
    }
    
    // クエリのエンベディング生成
    const queryVector = await getEmbeddingForQuery(queryText); // 上記の @ai-sdk/google を使う関数
    
    // PgVector ストアの query メソッドで検索実行
    const results: QueryResult[] = await store.query({
      indexName,
      queryVector,
      topK,
      filter,
    });
    
    // 結果を整形
    const relevantContext = results.length > 0
      ? results.map((r: QueryResult) => r.metadata?.text || "").filter(Boolean).join("\n\n")
      : "関連情報が見つかりませんでした。";
      
    return { relevantContext };

  } catch (error) {
    console.error("Vector search execution error:", error);
    return { error: /* ... エラーメッセージ ... */ };
  }
}
```
**(注意)** 上記の `store.query()` は `@mastra/pg` ライブラリの機能であり、内部的にはSQLを生成して実行します。インデックスが適切に作成されていれば、pgvectorがそれを利用して高速な検索を行います。

## Mastraでのベクトル検索設定 (推奨方法)

現在のプロジェクトでは、`@mastra/pg` の `PgVector` インスタンスを作成し、それを `Mastra` クラスのコンストラクタの `vectors` オプションに登録する方法を採用しています。これにより、フレームワーク全体でベクトルストアを管理し、ツールなどから参照しやすくなります。

```typescript
// src/mastra/index.ts (関連部分抜粋)
import { Mastra } from "@mastra/core";
import { PgVector } from "@mastra/pg";
// ... 他の初期化 ...

const pgVectorStore = new PgVector(env.POSTGRES_CONNECTION_STRING);

export const mastra = new Mastra({
  vectors: {
    pgVector: pgVectorStore, // キー 'pgVector' で登録
  },
  agents: { /* ... エージェント登録 ... */ },
  logger: { /* ... ロガー設定 ... */ },
});
```
ツール実装からは、以下のようにして登録済みの `PgVector` インスタンスを取得できます。

```typescript
// カスタムツール内
import { mastra } from "../../mastra";

// ...
const store = mastra.getVector('pgVector'); // 'pgVector' は登録時のキー
if (store) {
  // store.query(...) などで検索を実行
}
```
以前のドキュメントにあった Supabase RPC を直接呼び出す方法や、`pgVector.createVectorStore()` を使う方法は、現在の実装では採用していません。

## まとめ

Gemini APIの`text-embedding-004`モデルとSupabase/pgvector、そして Mastra フレームワークを組み合わせることで、RAG 機能を実現しました。主なポイントは：

1.  `@ai-sdk/google` を使用したエンベディング生成 (`text-embedding-004`)
2.  PostgreSQLのpgvector拡張と`ivfflat`インデックスによるベクトル格納・検索基盤
3.  **`Mastra` クラスへの `PgVector` インスタンス登録と、カスタムツール内での `mastra.getVector().query()` による検索実行**
4.  (参考) 事前データへのエンベディング生成バッチ処理

これにより、エージェントが外部ドキュメントの情報を参照しながら、より文脈に即した回答を生成できるようになりました。 