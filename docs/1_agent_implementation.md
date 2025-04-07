# 見積もりエージェントの実装

このドキュメントでは、Mastraフレームワークを使用した見積もりエージェントの実装方法について解説します。

## 概要

見積もりエージェントは、ユーザーからの要件入力に基づいて、業務システム開発の自動見積もりを生成するAIエージェントです。このエージェントは以下の機能を持ちます：

1. 初期要件の解析
2. 追加質問の生成と回答の処理
3. システムカテゴリの特定
4. 過去の類似案件からの参照
5. 見積もり生成と調整
6. PDF見積書の出力

## 前提条件

- Node.js v20以上
- Supabaseアカウント (データベースとして使用)
- Gemini API キー (LLMとして使用)

## エージェントの基本実装

```typescript
// src/mastra/agents/estimateAgent.ts
import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';
import { 
  analyzeRequirementsTool, 
  generateQuestionsTool,
  findSimilarProjectsTool,
  generateEstimateTool,
  generatePdfTool 
} from '../tools';

export const estimateAgent = new Agent({
  name: 'Estimate Agent',
  instructions: `
    あなたは業務システム開発の見積もり作成を支援するAIエージェントです。
    
    ユーザーから提供される初期要件を分析し、必要に応じて追加質問を生成してください。
    回答が十分に得られたら、最適なシステムカテゴリを特定し、類似案件を参照して
    見積もりを生成します。
    
    見積もりを作成する際は以下の点に注意してください：
    - 要件の複雑さに応じて工数と金額を適切に見積もる
    - 類似案件からの参照データを活用して精度を高める
    - 必要な機能を漏れなく洗い出す
    - リスク要因を特定し、適切なバッファを設ける
    
    最終的に、見積り内容をまとめたPDF見積書を生成してください。
  `,
  model: google('gemini-2.5-pro-preview-03-25'),
  tools: { 
    analyzeRequirementsTool,
    generateQuestionsTool,
    findSimilarProjectsTool,
    generateEstimateTool,
    generatePdfTool
  },
});
```

## ツールの実装例

各ツールは、見積もりプロセスの特定のステップを処理します。以下に主要なツールの実装例を示します。

### 1. 要件分析ツール

```typescript
// src/mastra/tools/analyzeRequirementsTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabaseClient";

export const analyzeRequirementsTool = createTool({
  id: "analyze-requirements",
  description: "初期要件を分析し、システムカテゴリを特定します",
  inputSchema: z.object({
    requirements: z.string().describe("ユーザーから提供された初期要件"),
  }),
  outputSchema: z.object({
    categoryId: z.string().optional(),
    categoryName: z.string().optional(),
    confidence: z.number().min(0).max(1),
    analysis: z.string(),
    requiresMoreInfo: z.boolean(),
  }),
  execute: async ({ context }) => {
    const { requirements } = context;
    
    // Gemini APIを使って要件テキストを解析
    // 実際の実装ではGemini APIの呼び出しを行う
    
    // 分析結果に基づいてシステムカテゴリを特定
    const { data: categories } = await supabase
      .from('system_categories')
      .select('*');
      
    // ここでカテゴリ特定のロジックを実装
    // 例: キーワードマッチング、エンベディング類似性など
    
    return {
      categoryId: "最も適合するカテゴリID",
      categoryName: "最も適合するカテゴリ名",
      confidence: 0.85, // 0-1の範囲で信頼度を示す
      analysis: "要件の分析結果テキスト",
      requiresMoreInfo: true, // 追加情報が必要かどうか
    };
  },
});
```

### 2. 追加質問生成ツール

```typescript
// src/mastra/tools/generateQuestionsTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabaseClient";

export const generateQuestionsTool = createTool({
  id: "generate-questions",
  description: "要件を明確にするための追加質問を生成します",
  inputSchema: z.object({
    requirements: z.string().describe("初期要件"),
    categoryId: z.string().optional().describe("特定されたシステムカテゴリID"),
    previousQuestions: z.array(z.string()).optional().describe("既に尋ねた質問"),
    previousAnswers: z.array(z.string()).optional().describe("得られた回答"),
  }),
  outputSchema: z.object({
    questions: z.array(z.object({
      id: z.string(),
      question: z.string(),
      importance: z.number().min(1).max(5),
      rationale: z.string(),
    })),
    isComplete: z.boolean(), // 質問が完了したかどうか
  }),
  execute: async ({ context }) => {
    const { requirements, categoryId, previousQuestions, previousAnswers } = context;
    
    // カテゴリ固有の質問テンプレートを取得
    let questions = [];
    
    if (categoryId) {
      const { data: category } = await supabase
        .from('system_categories')
        .select('default_questions')
        .eq('id', categoryId)
        .single();
        
      if (category?.default_questions) {
        // デフォルト質問をベースに、すでに回答があるものを除外
        // また、要件の内容に基づいて質問の重要度を調整
      }
    }
    
    // 共通質問を取得
    const { data: commonQuestions } = await supabase
      .from('question_templates')
      .select('*')
      .eq('category', 'common');
      
    // 最終的な質問リストを生成
    // 前回の回答に基づいて新たな質問を追加
    
    return {
      questions: [
        {
          id: "q1",
          question: "このシステムを利用するユーザー数はどのくらいを想定していますか？",
          importance: 5,
          rationale: "システム規模とライセンス数の算出に必要です",
        },
        // その他の質問...
      ],
      isComplete: false, // まだ質問が残っている
    };
  },
});
```

### 3. 類似プロジェクト検索ツール

```typescript
// src/mastra/tools/findSimilarProjectsTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { supabase } from "../../lib/supabaseClient";

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
    
    // コンテンツから検索用のエンベディングを生成
    const searchText = `
      要件: ${requirements}
      回答: ${JSON.stringify(answers)}
    `;
    
    // Gemini APIでエンベディングを生成
    // const embedding = await generateEmbedding(searchText);
    
    // 類似プロジェクトを検索
    // Supabase pgvectorを使用した類似性検索
    const { data: projects } = await supabase
      .rpc('match_projects', {
        query_embedding: "[0.1, 0.2, ...]", // 実際のエンベディング
        match_threshold: 0.7,
        match_count: 5,
        category_filter: categoryId
      });
    
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

### 4. 見積もり生成ツール

```typescript
// src/mastra/tools/generateEstimateTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const generateEstimateTool = createTool({
  id: "generate-estimate",
  description: "要件と類似プロジェクトに基づいて見積もりを生成します",
  inputSchema: z.object({
    requirements: z.string(),
    answers: z.record(z.string()),
    similarProjects: z.array(z.any()),
    categoryId: z.string().optional(),
  }),
  outputSchema: z.object({
    estimateId: z.string(),
    totalHours: z.number(),
    totalCost: z.number(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      estimatedHours: z.number(),
      unitPrice: z.number(),
      complexity: z.enum(["low", "medium", "high"]),
    })),
    notes: z.array(z.string()),
    assumptions: z.array(z.string()),
    risks: z.array(z.object({
      description: z.string(),
      impact: z.enum(["low", "medium", "high"]),
      mitigation: z.string().optional(),
    })),
  }),
  execute: async ({ context }) => {
    const { requirements, answers, similarProjects, categoryId } = context;
    
    // 類似プロジェクトの特徴を分析
    // 要件の複雑さに基づいて工数を調整
    // 質問への回答に基づいて必要な機能を特定
    
    // 見積もりを生成して保存
    const estimateId = "est_" + Date.now();
    
    // 実際の実装ではデータベースに保存
    
    return {
      estimateId,
      totalHours: 350,
      totalCost: 3500000,
      features: [
        {
          name: "ユーザー認証・権限管理",
          description: "複数権限レベルを持つユーザー管理システム",
          estimatedHours: 30,
          unitPrice: 300000,
          complexity: "medium",
        },
        // その他の機能...
      ],
      notes: [
        "本見積もりは概算であり、詳細要件によって変動する可能性があります",
        // その他の注意事項...
      ],
      assumptions: [
        "既存システムからのデータ移行は含まれていません",
        // その他の前提条件...
      ],
      risks: [
        {
          description: "要件の複雑さが予想以上に高い場合、工数が増加する可能性があります",
          impact: "medium",
          mitigation: "要件定義フェーズで詳細な機能仕様を固める",
        },
        // その他のリスク...
      ],
    };
  },
});
```

### 5. PDF生成ツール

```typescript
// src/mastra/tools/generatePdfTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
// PDFライブラリをインポート
// import { ... } from "...";

export const generatePdfTool = createTool({
  id: "generate-pdf",
  description: "見積もり情報からPDF見積書を生成します",
  inputSchema: z.object({
    estimateId: z.string(),
    clientName: z.string().optional(),
    projectName: z.string().optional(),
    validUntil: z.string().optional(), // ISO日付文字列
  }),
  outputSchema: z.object({
    pdfUrl: z.string(),
    estimateId: z.string(),
  }),
  execute: async ({ context }) => {
    const { estimateId, clientName, projectName, validUntil } = context;
    
    // 見積もり情報を取得
    // const estimate = await getEstimateById(estimateId);
    
    // PDFを生成
    // const pdfBuffer = await generatePdf(estimate, {
    //   clientName,
    //   projectName,
    //   validUntil,
    // });
    
    // Supabaseのストレージにアップロード
    // const { data } = await supabase.storage
    //   .from('estimate-pdfs')
    //   .upload(`${estimateId}.pdf`, pdfBuffer);
    
    // 公開URLを取得
    // const pdfUrl = supabase.storage
    //   .from('estimate-pdfs')
    //   .getPublicUrl(`${estimateId}.pdf`).data.publicUrl;
    
    return {
      pdfUrl: "https://example.com/pdfs/estimate_123.pdf", // 実際はSuabaseのURLを返す
      estimateId,
    };
  },
});
```

## ワークフロー実装

上記のツールを組み合わせて見積もりワークフローを構築します。

```typescript
// src/mastra/workflows/estimateWorkflow.ts
import { workflow } from '@mastra/core/workflow';
import { z } from 'zod';

export const estimateWorkflow = workflow({
  id: 'estimate-workflow',
  title: '見積もりワークフロー',
  description: '業務システム開発の自動見積もりを生成します',
  
  input: z.object({
    initialRequirements: z.string(),
    clientName: z.string().optional(),
    projectName: z.string().optional(),
  }),
  
  output: z.object({
    estimateId: z.string(),
    pdfUrl: z.string(),
    totalCost: z.number(),
    totalHours: z.number(),
  }),
  
  steps: [
    {
      id: 'analyze-requirements',
      title: '要件分析',
      run: async ({ input, tools }) => {
        const analysis = await tools.analyzeRequirementsTool({
          requirements: input.initialRequirements,
        });
        
        return {
          categoryId: analysis.categoryId,
          categoryName: analysis.categoryName,
          analysis: analysis.analysis,
          requiresMoreInfo: analysis.requiresMoreInfo,
        };
      },
    },
    {
      id: 'gather-information',
      title: '追加情報収集',
      run: async ({ input, state, tools }) => {
        let allQuestions = [];
        let allAnswers = {};
        let isComplete = false;
        
        // 質問が完了するまで繰り返す
        while (!isComplete) {
          const { questions, isComplete: complete } = await tools.generateQuestionsTool({
            requirements: input.initialRequirements,
            categoryId: state['analyze-requirements'].categoryId,
            previousQuestions: allQuestions,
            previousAnswers: Object.values(allAnswers),
          });
          
          isComplete = complete;
          
          if (!isComplete) {
            // 実際の実装では、ここでユーザーに質問を表示し回答を取得
            // この例では仮の回答を使用
            for (const q of questions) {
              allQuestions.push(q.question);
              allAnswers[q.id] = "ユーザーからの回答"; // 仮の回答
            }
          }
        }
        
        return {
          questions: allQuestions,
          answers: allAnswers,
        };
      },
    },
    {
      id: 'find-similar-projects',
      title: '類似案件検索',
      run: async ({ input, state, tools }) => {
        const { similarProjects } = await tools.findSimilarProjectsTool({
          requirements: input.initialRequirements,
          answers: state['gather-information'].answers,
          categoryId: state['analyze-requirements'].categoryId,
        });
        
        return {
          similarProjects,
        };
      },
    },
    {
      id: 'generate-estimate',
      title: '見積もり生成',
      run: async ({ input, state, tools }) => {
        const estimate = await tools.generateEstimateTool({
          requirements: input.initialRequirements,
          answers: state['gather-information'].answers,
          similarProjects: state['find-similar-projects'].similarProjects,
          categoryId: state['analyze-requirements'].categoryId,
        });
        
        return estimate;
      },
    },
    {
      id: 'generate-pdf',
      title: 'PDF生成',
      run: async ({ input, state, tools }) => {
        const { pdfUrl, estimateId } = await tools.generatePdfTool({
          estimateId: state['generate-estimate'].estimateId,
          clientName: input.clientName,
          projectName: input.projectName,
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
        });
        
        return {
          pdfUrl,
          estimateId,
        };
      },
    },
  ],
});
```

## Mastraインスタンスへの登録

これらの実装をMastraインスタンスに登録します。

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { estimateAgent } from './agents/estimateAgent';
import { estimateWorkflow } from './workflows/estimateWorkflow';
import { 
  analyzeRequirementsTool,
  generateQuestionsTool,
  findSimilarProjectsTool,
  generateEstimateTool,
  generatePdfTool 
} from './tools';

// Supabase PGVector設定
import { PgVector } from '@mastra/pg';
const pgVector = new PgVector({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
});

// Mastraインスタンスの作成
export const mastra = new Mastra({
  agents: { estimateAgent },
  workflows: { estimateWorkflow },
  tools: { 
    analyzeRequirementsTool,
    generateQuestionsTool,
    findSimilarProjectsTool,
    generateEstimateTool,
    generatePdfTool 
  },
  vectors: {
    projectTemplates: pgVector,
  },
  logger: createLogger({
    name: 'EstimateAgent',
    level: 'info',
  }),
});
```

## まとめ

このドキュメントでは、Mastraフレームワークを使用した見積もりエージェントの実装方法について解説しました。主な実装ポイントは：

1. AIエージェントの定義と指示の設計
2. 機能ごとのツールの実装
3. ワークフローによる見積もりプロセスの自動化
4. Supabase/PgVectorを活用したデータ管理と検索

これらの実装により、ユーザーの要件入力から見積もりPDFの生成までを自動化するAIシステムが構築できます。 