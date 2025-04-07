# エンベディング機能の実装

このドキュメントでは、見積もりシステムにおけるエンベディング機能の実装方法について解説します。エンベディングは、テキストデータをベクトル形式に変換し、意味的な類似性検索を可能にする技術です。

## 概要

見積もりシステムにおけるエンベディングの主な用途は以下の通りです：

1.  過去の類似プロジェクトの検索
2.  入力された要件に基づくシステムカテゴリの特定
3.  関連質問の生成

Gemini APIの`text-embedding-004`モデルを使用して、テキストデータを768次元のベクトル形式に変換し、Supabase PostgreSQLのpgvector拡張を利用して類似性検索を行います。`ivfflat`インデックスを使用します。

## 前提条件

- Node.js v20以上
- Supabase (pgvector拡張が有効)
- Gemini API キー

## 実装手順

### 1. 必要なパッケージのインストール

```bash
# Supabase クライアントとその他の依存関係
bun add @supabase/supabase-js @mastra/pg
```

### 2. Supabase セットアップ

まず、Supabaseでpgvector拡張を有効にします。

```sql
-- Supabaseコンソールのエディタから実行
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. エンベディング生成用関数の実装

```typescript
// src/lib/embedding.ts
import { createClient } from '@supabase/supabase-js';

// Supabaseクライアントの初期化
export const supabase = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

/**
 * テキストからエンベディングを生成する関数 (text-embedding-004を使用)
 * @param text エンベディングを生成するテキスト
 * @returns 768次元のエンベディングベクトル
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  
  if (!GEMINI_API_KEY) {
    throw new Error('環境変数 GEMINI_API_KEY が設定されていません');
  }

  const modelName = 'models/text-embedding-004'; // 使用するモデル名を変更
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${modelName}:embedContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          content: {
            parts: [{ text }]
          },
          // taskType は text-embedding-004 では不要/非推奨
        })
      }
    );
    
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Gemini API エラーレスポンス:', data);
      throw new Error(`エンベディング生成APIエラー: ${response.status} ${response.statusText}`);
    }

    // text-embedding-004 のレスポンス形式に合わせて修正
    if (!data.embedding || !data.embedding.values) { 
      console.error('無効なエンベディングデータ:', data);
      throw new Error('エンベディングの生成に失敗しました。APIレスポンスの形式が不正です。');
    }
    
    // 768次元のベクトルが返されることを想定
    if (data.embedding.values.length !== 768) {
        console.warn(`期待した768次元と異なる次元数 (${data.embedding.values.length}) のベクトルが返されました。`);
    }

    return data.embedding.values;
  } catch (error) {
    console.error('エンベディング生成中に予期せぬエラー:', error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`エンベディング生成に失敗: ${message}`);
  }
}
```

### 4. プロジェクトテンプレートのエンベディング生成スクリプト

プロジェクトテンプレートからエンベディングを生成し、データベースに保存するスクリプトを実装します。

```typescript
// scripts/generate-embeddings.ts
import { supabase, generateEmbedding } from '../src/lib/embedding';

async function generateProjectTemplateEmbeddings() {
  // プロジェクトテンプレートの取得
  const { data: templates, error } = await supabase
    .from('project_templates')
    .select('*');
    
  if (error) {
    console.error('テンプレート取得エラー:', error);
    return;
  }
  
  console.log(`${templates.length}件のテンプレートのエンベディングを生成します`);
  
  for (const template of templates) {
    // エンベディング用のテキストを生成
    const textToEmbed = `
      名前: ${template.name}
      カテゴリ: ${template.category}
      説明: ${template.description}
      機能: ${JSON.stringify(template.features)}
    `;
    
    try {
      // エンベディングの生成
      const embedding = await generateEmbedding(textToEmbed);
      
      // エンベディングをデータベースに保存
      const { error: updateError } = await supabase
        .from('project_templates')
        .update({ content_embedding: embedding })
        .eq('id', template.id);
        
      if (updateError) {
        console.error(`テンプレート ${template.id} の更新エラー:`, updateError);
      } else {
        console.log(`テンプレート ${template.id} のエンベディングを更新しました`);
      }
    } catch (error) {
      console.error(`テンプレート ${template.id} のエンベディング生成に失敗:`, error);
    }
  }
}

// 実行
generateProjectTemplateEmbeddings()
  .then(() => console.log('エンベディング生成完了'))
  .catch(err => console.error('エラー:', err));
```

### 5. システムカテゴリのエンベディング生成スクリプト

```typescript
// scripts/generate-category-embeddings.ts
import { supabase, generateEmbedding } from '../src/lib/embedding';

async function generateCategoryEmbeddings() {
  // システムカテゴリの取得
  const { data: categories, error } = await supabase
    .from('system_categories')
    .select('*');
    
  if (error) {
    console.error('カテゴリ取得エラー:', error);
    return;
  }
  
  console.log(`${categories.length}件のカテゴリのエンベディングを生成します`);
  
  for (const category of categories) {
    // エンベディング用のテキストを生成
    const textToEmbed = `
      名前: ${category.name}
      説明: ${category.description}
      キーワード: ${JSON.stringify(category.keywords)}
    `;
    
    try {
      // エンベディングの生成
      const embedding = await generateEmbedding(textToEmbed);
      
      // エンベディングをデータベースに保存
      const { error: updateError } = await supabase
        .from('system_categories')
        .update({ content_embedding: embedding })
        .eq('id', category.id);
        
      if (updateError) {
        console.error(`カテゴリ ${category.id} の更新エラー:`, updateError);
      } else {
        console.log(`カテゴリ ${category.id} のエンベディングを更新しました`);
      }
    } catch (error) {
      console.error(`カテゴリ ${category.id} のエンベディング生成に失敗:`, error);
    }
  }
}

// 実行
generateCategoryEmbeddings()
  .then(() => console.log('エンベディング生成完了'))
  .catch(err => console.error('エラー:', err));
```

### 6. PostgreSQL関数の作成(類似プロジェクト検索用)

Supabaseの管理コンソールから以下のSQLを実行して、ベクトル類似性検索のための関数を作成します。768次元ベクトルと`ivfflat`インデックスの使用を前提としています。

```sql
-- 要件に基づいて類似プロジェクトを検索する関数 (768次元)
CREATE OR REPLACE FUNCTION match_projects(
  query_embedding vector(768), -- 次元数を768に変更
  match_threshold float,
  match_count int,
  category_filter text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  name text,
  category text,
  description text,
  features jsonb,
  actual_hours int,
  actual_cost int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pt.id,
    pt.name,
    pt.category,
    pt.description,
    pt.features,
    pt.actual_hours,
    pt.actual_cost,
    1 - (pt.content_embedding <=> query_embedding) as similarity
  FROM project_templates pt
  WHERE
    pt.content_embedding IS NOT NULL -- エンベディングが存在するもののみ対象
    AND (category_filter IS NULL OR pt.category = category_filter)
    AND 1 - (pt.content_embedding <=> query_embedding) > match_threshold
  ORDER BY pt.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

同様に、システムカテゴリを検索するための関数も作成します。

```sql
-- 要件に基づいてシステムカテゴリを検索する関数 (768次元)
CREATE OR REPLACE FUNCTION match_categories(
  query_embedding vector(768), -- 次元数を768に変更
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  keywords jsonb,
  default_questions jsonb,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    sc.id,
    sc.name,
    sc.description,
    sc.keywords,
    sc.default_questions,
    1 - (sc.content_embedding <=> query_embedding) as similarity
  FROM system_categories sc
  WHERE 
    sc.content_embedding IS NOT NULL -- エンベディングが存在するもののみ対象
    AND 1 - (sc.content_embedding <=> query_embedding) > match_threshold
  ORDER BY sc.content_embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

また、これらの関数で利用する`ivfflat`インデックスを作成しておく必要があります。

```sql
-- project_templates テーブル用 ivfflat インデックス (768次元)
CREATE INDEX IF NOT EXISTS project_templates_embedding_ivfflat_idx 
ON public.project_templates 
USING ivfflat (content_embedding vector_cosine_ops); 
-- WITH (lists = 100); -- 必要に応じてリスト数を調整

-- system_categories テーブル用 ivfflat インデックス (768次元)
CREATE INDEX IF NOT EXISTS system_categories_embedding_ivfflat_idx 
ON public.system_categories 
USING ivfflat (content_embedding vector_cosine_ops);
-- WITH (lists = 100); -- 必要に応じてリスト数を調整
```

### 7. Mastra実装での使用例

これらのエンベディング機能を活用して、要件分析ツールを実装します。

```typescript
// src/mastra/tools/findSimilarProjectsTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase, generateEmbedding } from "../../lib/embedding";

export const findSimilarProjectsTool = createTool({
  id: "find-similar-projects",
  description: "要件に類似した過去のプロジェクトを検索します",
  inputSchema: z.object({
    requirements: z.string().describe("ユーザーの要件"),
    answers: z.record(z.string()).describe("質問への回答"),
    categoryId: z.string().optional().describe("システムカテゴリID"),
  }),
  outputSchema: z.object({
    similarProjects: z.array(z.object({
      id: z.string(),
      name: z.string(),
      similarity: z.number(),
      features: z.array(z.any()),
      actualHours: z.number(),
      actualCost: z.number(),
    })),
  }),
  execute: async ({ context }) => {
    const { requirements, answers, categoryId } = context;
    
    // 検索用テキストの作成
    const searchText = `
      要件: ${requirements}
      回答: ${JSON.stringify(answers)}
    `;
    
    // エンベディングの生成
    const embedding = await generateEmbedding(searchText);
    
    // 類似プロジェクトの検索
    const { data: projects, error } = await supabase
      .rpc('match_projects', {
        query_embedding: embedding,
        match_threshold: 0.7,
        match_count: 5,
        category_filter: categoryId || null
      });
    
    if (error) {
      console.error('類似プロジェクト検索エラー:', error);
      throw error;
    }
    
    return {
      similarProjects: projects.map(project => ({
        id: project.id,
        name: project.name,
        similarity: project.similarity,
        features: project.features,
        actualHours: project.actual_hours,
        actualCost: project.actual_cost,
      })),
    };
  },
});
```

同様に、システムカテゴリを特定するツールも実装します。

```typescript
// src/mastra/tools/analyzeCategoryTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase, generateEmbedding } from "../../lib/embedding";

export const analyzeCategoryTool = createTool({
  id: "analyze-category",
  description: "要件に基づいて最適なシステムカテゴリを特定します",
  inputSchema: z.object({
    requirements: z.string().describe("ユーザーから提供された要件"),
  }),
  outputSchema: z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    confidence: z.number().min(0).max(1),
    description: z.string(),
  }),
  execute: async ({ context }) => {
    const { requirements } = context;
    
    // 要件のエンベディングを生成
    const embedding = await generateEmbedding(requirements);
    
    // 類似度の高いカテゴリを検索
    const { data: categories, error } = await supabase
      .rpc('match_categories', {
        query_embedding: embedding,
        match_threshold: 0.5,
        match_count: 3
      });
    
    if (error) {
      console.error('カテゴリ検索エラー:', error);
      throw error;
    }
    
    if (!categories || categories.length === 0) {
      throw new Error('適合するカテゴリが見つかりませんでした');
    }
    
    // 最も類似度の高いカテゴリを選択
    const bestMatch = categories[0];
    
    return {
      categoryId: bestMatch.id,
      categoryName: bestMatch.name,
      confidence: bestMatch.similarity,
      description: bestMatch.description,
    };
  },
});
```

## Mastraでのベクトル検索設定

Mastraフレームワークにベクトル検索機能を組み込む場合、SupabaseのRPC呼び出しを通じて上記で作成した関数を利用するのが一般的です。PgVectorライブラリを直接利用する代わりに、RPC経由で検索を実行します。以下はRPC呼び出しを利用するツールの例です（上記Step 7のコード例を参照）。

もし `@mastra/pg` の `PgVector` を直接利用する場合、以下のように設定します。

```typescript
// src/mastra/index.ts (PgVector を直接利用する場合の例)
import { Mastra } from '@mastra/core/mastra';
import { PgVector } from '@mastra/pg';
import { estimateAgent } from './agents/estimateAgent';
import { estimateWorkflow } from './workflows/estimateWorkflow';

// PgVector設定
const pgVector = new PgVector({
  connectionString: process.env.SUPABASE_CONNECTION_STRING, // DB接続文字列
});

// Mastraインスタンスの作成時にベクターストアとして登録
export const mastra = new Mastra({
  agents: { estimateAgent },
  workflows: { estimateWorkflow },
  vectors: {
    projectTemplates: pgVector.createVectorStore({
      tableName: 'project_templates',
      embeddingColumnName: 'content_embedding',
      dimension: 768, // 次元数を768に変更
      indexType: 'ivfflat', // インデックスタイプをivfflatに
      metric: 'cosine',
    }),
    systemCategories: pgVector.createVectorStore({
      tableName: 'system_categories',
      embeddingColumnName: 'content_embedding',
      dimension: 768,
      indexType: 'ivfflat',
      metric: 'cosine',
    }),
    // 他のベクターストア...
  },
});

// 注意: @mastra/pg を直接利用する場合、インデックス作成は別途SQLで行うか、
// ライブラリの機能で行う必要があります。上記は設定例です。
```

## ユーティリティ関数: テキスト検索

```typescript
// src/lib/searchUtils.ts
import { supabase, generateEmbedding } from './embedding';

/**
 * テキスト検索を行い、類似度の高いプロジェクトを返す
 */
export async function searchSimilarProjects(
  searchText: string,
  options: {
    threshold?: number;
    limit?: number;
    categoryId?: string;
  } = {}
) {
  const {
    threshold = 0.7,
    limit = 5,
    categoryId
  } = options;
  
  // テキストからエンベディングを生成
  const embedding = await generateEmbedding(searchText);
  
  // 類似度検索を実行
  const { data, error } = await supabase
    .rpc('match_projects', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit,
      category_filter: categoryId || null
    });
    
  if (error) {
    console.error('検索エラー:', error);
    throw error;
  }
  
  return data;
}

/**
 * テキストに最適なシステムカテゴリを検索
 */
export async function findBestCategory(
  searchText: string,
  options: {
    threshold?: number;
    limit?: number;
  } = {}
) {
  const {
    threshold = 0.5,
    limit = 3
  } = options;
  
  // テキストからエンベディングを生成
  const embedding = await generateEmbedding(searchText);
  
  // カテゴリ検索を実行
  const { data, error } = await supabase
    .rpc('match_categories', {
      query_embedding: embedding,
      match_threshold: threshold,
      match_count: limit
    });
    
  if (error) {
    console.error('カテゴリ検索エラー:', error);
    throw error;
  }
  
  return data;
}
```

## まとめ

Gemini APIの`text-embedding-004`モデルとSupabase/pgvectorを組み合わせることで、テキストベースの自然言語要件から類似プロジェクトやシステムカテゴリを特定する機能を実装しました。主なポイントは：

1.  Gemini APIの`text-embedding-004`モデル (768次元) を使用
2.  PostgreSQLのpgvector拡張を活用し、`ivfflat`インデックスを用いた類似度検索
3.  システムカテゴリ自動特定とプロジェクト類似性検索の実装
4.  Mastraフレームワークとの統合（主にSupabase RPC経由での関数呼び出しを推奨）

これにより、ユーザーが自然言語で入力した要件に基づいて、適切なカテゴリの特定や過去の類似案件からの参照が可能になり、見積もりの精度と効率が向上します。 