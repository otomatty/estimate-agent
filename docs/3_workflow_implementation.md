# 見積もりワークフローの実装

このドキュメントでは、Mastraフレームワークを使用した見積もりワークフローの実装方法について解説します。

## 概要

見積もりワークフローは、ユーザーの要件入力から見積もりPDF生成までの一連のプロセスを自動化する仕組みです。このワークフローは以下のステップで構成されています：

1. 初期要件の分析
2. システムカテゴリの特定
3. 追加質問の生成と回答収集
4. 類似プロジェクトの検索
5. 見積もりの生成
6. PDF見積書の作成

## ワークフローの基本構造

Mastraのワークフローは、入力、出力、そして複数のステップで構成されています。各ステップは順番に実行され、前のステップの結果を次のステップで利用できます。

```typescript
// src/mastra/workflows/estimateWorkflow.ts
import { workflow } from '@mastra/core/workflow';
import { z } from 'zod';
import { 
  analyzeRequirementsTool, 
  generateQuestionsTool,
  findSimilarProjectsTool,
  generateEstimateTool,
  generatePdfTool 
} from '../tools';

export const estimateWorkflow = workflow({
  id: 'estimate-workflow',
  title: '見積もりワークフロー',
  description: '業務システム開発の自動見積もりを生成します',
  
  input: z.object({
    initialRequirements: z.string().describe('ユーザーから提供された初期要件'),
    clientName: z.string().optional().describe('クライアント名'),
    projectName: z.string().optional().describe('プロジェクト名'),
  }),
  
  output: z.object({
    estimateId: z.string(),
    pdfUrl: z.string(),
    totalCost: z.number(),
    totalHours: z.number(),
  }),
  
  steps: [
    // 各ステップの実装（後述）
  ],
});
```

## 各ステップの詳細実装

### 1. 要件分析とシステムカテゴリ特定ステップ

```typescript
{
  id: 'analyze-requirements',
  title: '要件分析とカテゴリ特定',
  run: async ({ input, tools }) => {
    // 要件の分析
    const requirementsAnalysis = await tools.analyzeRequirementsTool({
      requirements: input.initialRequirements,
    });
    
    // カテゴリの特定
    const categoryAnalysis = await tools.analyzeCategoryTool({
      requirements: input.initialRequirements,
    });
    
    return {
      categoryId: categoryAnalysis.categoryId,
      categoryName: categoryAnalysis.categoryName,
      categoryConfidence: categoryAnalysis.confidence,
      analysis: requirementsAnalysis.analysis,
      requiresMoreInfo: requirementsAnalysis.requiresMoreInfo,
    };
  },
},
```

### 2. 追加情報収集ステップ

```typescript
{
  id: 'gather-information',
  title: '追加情報収集',
  run: async ({ input, state, tools }) => {
    // 質問生成と回答収集のための状態管理
    let allQuestions = [];
    let allAnswers = {};
    let isComplete = false;
    let round = 1;
    
    // 質問が完了するまで繰り返す（フロントエンドとの連携を前提とした実装）
    while (!isComplete && round <= 3) { // 最大3ラウンドまで
      console.log(`質問ラウンド ${round}`);
      
      const { questions, isComplete: complete } = await tools.generateQuestionsTool({
        requirements: input.initialRequirements,
        categoryId: state['analyze-requirements'].categoryId,
        previousQuestions: allQuestions,
        previousAnswers: Object.values(allAnswers),
      });
      
      isComplete = complete;
      
      if (!isComplete) {
        // フロントエンドからの回答を模擬
        // 実際の実装では、ここでフロントエンドからの回答待ちとなる
        for (const q of questions) {
          allQuestions.push(q.question);
          
          // 仮の回答（デモ用）
          // 実際の実装では、ユーザーからの入力を受け取る
          allAnswers[q.id] = `質問「${q.question}」への仮の回答です。`;
        }
        
        round++;
      }
    }
    
    return {
      questions: allQuestions,
      answers: allAnswers,
      isComplete,
    };
  },
},
```

### 3. 類似プロジェクト検索ステップ

```typescript
{
  id: 'find-similar-projects',
  title: '類似案件検索',
  run: async ({ input, state, tools }) => {
    // 蓄積された情報を基に類似プロジェクトを検索
    const { similarProjects } = await tools.findSimilarProjectsTool({
      requirements: input.initialRequirements,
      answers: state['gather-information'].answers,
      categoryId: state['analyze-requirements'].categoryId,
    });
    
    // 類似度の高い順にソート
    const sortedProjects = [...similarProjects].sort((a, b) => b.similarity - a.similarity);
    
    return {
      similarProjects: sortedProjects,
      topProject: sortedProjects.length > 0 ? sortedProjects[0] : null,
    };
  },
},
```

### 4. 見積もり生成ステップ

```typescript
{
  id: 'generate-estimate',
  title: '見積もり生成',
  run: async ({ input, state, tools }) => {
    // 収集した情報を基に見積もりを生成
    const estimate = await tools.generateEstimateTool({
      requirements: input.initialRequirements,
      answers: state['gather-information'].answers,
      similarProjects: state['find-similar-projects'].similarProjects,
      categoryId: state['analyze-requirements'].categoryId,
    });
    
    // 見積もり結果を保存（実際の実装ではデータベースに保存）
    
    return {
      estimateId: estimate.estimateId,
      totalHours: estimate.totalHours,
      totalCost: estimate.totalCost,
      features: estimate.features,
      notes: estimate.notes,
      assumptions: estimate.assumptions,
      risks: estimate.risks,
    };
  },
},
```

### 5. PDF生成ステップ

```typescript
{
  id: 'generate-pdf',
  title: 'PDF見積書生成',
  run: async ({ input, state, tools }) => {
    // 見積もり情報からPDF見積書を生成
    const { pdfUrl, estimateId } = await tools.generatePdfTool({
      estimateId: state['generate-estimate'].estimateId,
      clientName: input.clientName || '未設定',
      projectName: input.projectName || '業務システム開発',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
    });
    
    return {
      pdfUrl,
      estimateId,
      totalCost: state['generate-estimate'].totalCost,
      totalHours: state['generate-estimate'].totalHours,
    };
  },
},
```

## 完全なワークフロー実装

上記のステップを組み合わせた完全なワークフロー実装は以下の通りです：

```typescript
// src/mastra/workflows/estimateWorkflow.ts
import { workflow } from '@mastra/core/workflow';
import { z } from 'zod';
import { 
  analyzeRequirementsTool, 
  analyzeCategoryTool,
  generateQuestionsTool,
  findSimilarProjectsTool,
  generateEstimateTool,
  generatePdfTool 
} from '../tools';

export const estimateWorkflow = workflow({
  id: 'estimate-workflow',
  title: '見積もりワークフロー',
  description: '業務システム開発の自動見積もりを生成します',
  
  input: z.object({
    initialRequirements: z.string().describe('ユーザーから提供された初期要件'),
    clientName: z.string().optional().describe('クライアント名'),
    projectName: z.string().optional().describe('プロジェクト名'),
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
      title: '要件分析とカテゴリ特定',
      run: async ({ input, tools }) => {
        // 要件の分析
        const requirementsAnalysis = await tools.analyzeRequirementsTool({
          requirements: input.initialRequirements,
        });
        
        // カテゴリの特定
        const categoryAnalysis = await tools.analyzeCategoryTool({
          requirements: input.initialRequirements,
        });
        
        return {
          categoryId: categoryAnalysis.categoryId,
          categoryName: categoryAnalysis.categoryName,
          categoryConfidence: categoryAnalysis.confidence,
          analysis: requirementsAnalysis.analysis,
          requiresMoreInfo: requirementsAnalysis.requiresMoreInfo,
        };
      },
    },
    {
      id: 'gather-information',
      title: '追加情報収集',
      run: async ({ input, state, tools }) => {
        // 質問生成と回答収集のための状態管理
        let allQuestions = [];
        let allAnswers = {};
        let isComplete = false;
        let round = 1;
        
        // 質問が完了するまで繰り返す
        while (!isComplete && round <= 3) { // 最大3ラウンドまで
          console.log(`質問ラウンド ${round}`);
          
          const { questions, isComplete: complete } = await tools.generateQuestionsTool({
            requirements: input.initialRequirements,
            categoryId: state['analyze-requirements'].categoryId,
            previousQuestions: allQuestions,
            previousAnswers: Object.values(allAnswers),
          });
          
          isComplete = complete;
          
          if (!isComplete) {
            // フロントエンドからの回答を模擬
            // 実際の実装では、ここでフロントエンドからの回答待ちとなる
            for (const q of questions) {
              allQuestions.push(q.question);
              
              // 仮の回答（デモ用）
              // 実際の実装では、ユーザーからの入力を受け取る
              allAnswers[q.id] = `質問「${q.question}」への仮の回答です。`;
            }
            
            round++;
          }
        }
        
        return {
          questions: allQuestions,
          answers: allAnswers,
          isComplete,
        };
      },
    },
    {
      id: 'find-similar-projects',
      title: '類似案件検索',
      run: async ({ input, state, tools }) => {
        // 蓄積された情報を基に類似プロジェクトを検索
        const { similarProjects } = await tools.findSimilarProjectsTool({
          requirements: input.initialRequirements,
          answers: state['gather-information'].answers,
          categoryId: state['analyze-requirements'].categoryId,
        });
        
        // 類似度の高い順にソート
        const sortedProjects = [...similarProjects].sort((a, b) => b.similarity - a.similarity);
        
        return {
          similarProjects: sortedProjects,
          topProject: sortedProjects.length > 0 ? sortedProjects[0] : null,
        };
      },
    },
    {
      id: 'generate-estimate',
      title: '見積もり生成',
      run: async ({ input, state, tools }) => {
        // 収集した情報を基に見積もりを生成
        const estimate = await tools.generateEstimateTool({
          requirements: input.initialRequirements,
          answers: state['gather-information'].answers,
          similarProjects: state['find-similar-projects'].similarProjects,
          categoryId: state['analyze-requirements'].categoryId,
        });
        
        // 見積もり結果を保存（実際の実装ではデータベースに保存）
        
        return {
          estimateId: estimate.estimateId,
          totalHours: estimate.totalHours,
          totalCost: estimate.totalCost,
          features: estimate.features,
          notes: estimate.notes,
          assumptions: estimate.assumptions,
          risks: estimate.risks,
        };
      },
    },
    {
      id: 'generate-pdf',
      title: 'PDF見積書生成',
      run: async ({ input, state, tools }) => {
        // 見積もり情報からPDF見積書を生成
        const { pdfUrl, estimateId } = await tools.generatePdfTool({
          estimateId: state['generate-estimate'].estimateId,
          clientName: input.clientName || '未設定',
          projectName: input.projectName || '業務システム開発',
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30日後
        });
        
        return {
          pdfUrl,
          estimateId,
          totalCost: state['generate-estimate'].totalCost,
          totalHours: state['generate-estimate'].totalHours,
        };
      },
    },
  ],
});
```

## ワークフローの実行方法

ワークフローは、APIエンドポイントを通じて実行する方法と、プログラム内から直接実行する方法があります。

### APIエンドポイントを通じた実行

Mastraでは、ワークフローを自動的にAPIエンドポイントとして公開できます。

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra';
import { estimateWorkflow } from './workflows/estimateWorkflow';

export const mastra = new Mastra({
  workflows: { estimateWorkflow },
});
```

この設定により、`/api/workflows/estimateWorkflow` エンドポイントが自動的に作成されます。

例えば、フロントエンドからAPIを呼び出す場合：

```typescript
// client/src/app/estimate/page.tsx
'use client';

import { useState } from 'react';

export default function EstimatePage() {
  const [requirements, setRequirements] = useState('');
  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/workflows/estimateWorkflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          initialRequirements: requirements,
          clientName,
          projectName,
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">業務システム見積もり作成</h1>
      
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label className="block mb-2">クライアント名</label>
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">プロジェクト名</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        
        <div className="mb-4">
          <label className="block mb-2">システム要件</label>
          <textarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            className="w-full p-2 border rounded"
            rows={8}
            placeholder="開発したいシステムの概要、目的、必要な機能などを入力してください..."
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {loading ? '処理中...' : '見積もり作成'}
        </button>
      </form>
      
      {result && (
        <div className="border p-4 rounded">
          <h2 className="text-xl font-bold mb-2">見積もり結果</h2>
          <p>見積もりID: {result.estimateId}</p>
          <p>合計工数: {result.totalHours}時間</p>
          <p>合計金額: {result.totalCost.toLocaleString()}円</p>
          <p>
            <a
              href={result.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              見積書PDFを表示
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
```

### プログラム内からの直接実行

プログラム内から直接ワークフローを実行することもできます。

```typescript
// scripts/run-workflow.ts
import { mastra } from '../src/mastra';

async function main() {
  const workflow = mastra.getWorkflow('estimateWorkflow');
  
  const result = await workflow.run({
    initialRequirements: `
      中小企業向けの顧客管理システムを開発したいと考えています。
      顧客情報の管理、商談管理、案件管理の機能が必要です。
      ユーザー数は約50人程度、顧客データは約500社分を想定しています。
      モバイル対応も必要です。
    `,
    clientName: '株式会社サンプル',
    projectName: '顧客管理システム開発',
  });
  
  console.log('ワークフロー実行結果:');
  console.log('見積もりID:', result.estimateId);
  console.log('合計工数:', result.totalHours, '時間');
  console.log('合計金額:', result.totalCost.toLocaleString(), '円');
  console.log('見積書PDF:', result.pdfUrl);
}

main().catch(console.error);
```

## エラーハンドリング

ワークフローでは、各ステップでのエラーを適切に処理することが重要です。例えば、類似プロジェクトが見つからない場合のフォールバック処理を実装できます。

```typescript
// src/mastra/workflows/estimateWorkflow.ts（一部抜粋）
{
  id: 'find-similar-projects',
  title: '類似案件検索',
  run: async ({ input, state, tools }) => {
    try {
      const { similarProjects } = await tools.findSimilarProjectsTool({
        requirements: input.initialRequirements,
        answers: state['gather-information'].answers,
        categoryId: state['analyze-requirements'].categoryId,
      });
      
      const sortedProjects = [...similarProjects].sort((a, b) => b.similarity - a.similarity);
      
      return {
        similarProjects: sortedProjects,
        topProject: sortedProjects.length > 0 ? sortedProjects[0] : null,
      };
    } catch (error) {
      console.error('類似プロジェクト検索エラー:', error);
      
      // エラー時のフォールバック: 空の結果を返す
      return {
        similarProjects: [],
        topProject: null,
        error: `検索エラー: ${error.message}`,
      };
    }
  },
},
```

## 進捗状況のモニタリング

長時間実行されるワークフローの場合、進捗状況をモニタリングできるようにするとよいでしょう。Mastraではワークフローの各ステップの開始と完了をログに記録できます。

```typescript
// src/mastra/index.ts
import { Mastra } from '@mastra/core/mastra';
import { createLogger } from '@mastra/core/logger';
import { estimateWorkflow } from './workflows/estimateWorkflow';

// カスタムロガーを作成
const logger = createLogger({
  name: 'EstimateAgent',
  level: 'info',
  // ログをファイルや外部サービスに送信する設定も可能
});

export const mastra = new Mastra({
  workflows: { estimateWorkflow },
  logger,
});
```

## ビジネス分析ワークフロー

拡張機能として、単なる見積もりだけでなく、ビジネス価値を分析する「ビジネス分析ワークフロー」を実装します。このワークフローは見積もりの後に呼び出され、投資対効果（ROI）やコスト最適化、効率化予測などを算出します。

```typescript
// src/mastra/workflows/businessAnalysisWorkflow.ts
import { workflow } from '@mastra/core/workflow';
import { z } from 'zod';

export const businessAnalysisWorkflow = workflow({
  id: 'business-analysis-workflow',
  title: 'ビジネス分析ワークフロー',
  description: '見積もり結果から投資対効果（ROI）やコスト最適化案を生成します',
  
  input: z.object({
    estimateId: z.string(),
    clientName: z.string().optional(),
    projectName: z.string().optional(),
    totalHours: z.number(),
    totalCost: z.number(),
    features: z.array(z.object({
      name: z.string(),
      description: z.string(),
      estimatedHours: z.number(),
      unitPrice: z.number(),
      complexity: z.enum(["low", "medium", "high"]),
    })),
    industry: z.string().optional(),
    companySize: z.number().optional(),
    currentProcessHours: z.number().optional(), // 現在の業務プロセスにかかる時間
  }),
  
  steps: [
    // 1. コスト最適化分析
    {
      id: 'cost-optimization',
      title: 'コスト最適化分析',
      run: async ({ input, state, tools }) => {
        // 機能の優先順位付け
        const prioritizedFeatures = input.features.map(feature => {
          // 複雑さとコストに基づいて投資効率を計算
          const complexityFactor = 
            feature.complexity === 'high' ? 0.7 : 
            feature.complexity === 'medium' ? 0.85 : 1;
          
          const investmentEfficiency = feature.estimatedHours > 0 
            ? (feature.unitPrice / feature.estimatedHours) * complexityFactor
            : 0;
          
          return {
            ...feature,
            priority: investmentEfficiency > 12000 ? 'high' : 
                     investmentEfficiency > 8000 ? 'medium' : 'low',
            investmentEfficiency,
          };
        });
        
        // 優先度でソート
        const sortedFeatures = [...prioritizedFeatures].sort((a, b) => {
          const priorityValue = { high: 3, medium: 2, low: 1 };
          return priorityValue[b.priority] - priorityValue[a.priority];
        });
        
        // 最小実装セットの計算（優先度の高い機能のみ）
        const minimalFeatures = sortedFeatures.filter(f => f.priority === 'high');
        const minimalCost = minimalFeatures.reduce((sum, f) => sum + f.unitPrice, 0);
        
        // 削減可能コスト（優先度の低い機能を除外した場合）
        const lowPriorityFeatures = sortedFeatures.filter(f => f.priority === 'low');
        const reducibleCost = lowPriorityFeatures.reduce((sum, f) => sum + f.unitPrice, 0);
        
        return {
          prioritizedFeatures: sortedFeatures,
          minimalFeatures,
          minimalCost,
          reducibleCost,
          potentialSavings: Math.round(input.totalCost * 0.15), // 簡易計算値
          minimalImplementationCost: Math.round(input.totalCost * 0.6), // 簡易計算値
        };
      },
    },
    
    // 2. ROI（投資対効果）分析
    {
      id: 'roi-analysis',
      title: 'ROI分析',
      run: async ({ input, state, tools }) => {
        // 業界や企業規模に基づく標準的な年間削減額を算出
        // 実際には業界ごとのデータをデータベースから取得するべき
        const industry = input.industry || 'general';
        const companySize = input.companySize || 50;
        
        // 業界別年間削減率（例示値）
        const industrySavingsRate = {
          manufacturing: 0.35,
          retail: 0.28,
          finance: 0.32,
          healthcare: 0.25,
          general: 0.3
        };
        
        const savingsRate = industrySavingsRate[industry] || 0.3;
        
        // 年間削減額の計算 (企業規模に比例)
        const annualSavings = Math.round(input.totalCost * savingsRate * (companySize / 50));
        
        // 投資回収期間の計算（月単位）
        const paybackPeriodMonths = Math.ceil((input.totalCost / annualSavings) * 12);
        
        // 5年間のROI計算
        const fiveYearROI = Math.round(((annualSavings * 5 - input.totalCost) / input.totalCost) * 100);
        
        // 年ごとの累積ROI
        const yearlyROI = Array.from({ length: 5 }, (_, i) => {
          const year = i + 1;
          const totalSavings = annualSavings * year;
          const roi = Math.round(((totalSavings - input.totalCost) / input.totalCost) * 100);
          return { year, roi: Math.max(-100, roi) };
        });
        
        return {
          annualSavings,
          paybackPeriodMonths,
          fiveYearROI,
          yearlyROI,
        };
      },
    },
    
    // 3. 業務効率化予測
    {
      id: 'efficiency-prediction',
      title: '業務効率化予測',
      run: async ({ input, state, tools }) => {
        // 現在の業務プロセスにかかる時間（指定がなければ推定）
        const currentProcessHours = input.currentProcessHours || (input.totalHours * 2.5);
        
        // 削減率の計算
        const reductionRate = Math.round(((currentProcessHours - input.totalHours) / currentProcessHours) * 100);
        
        // 業務カテゴリー別の効率化率
        const taskEfficiencyRates = [
          { task: "データ入力/管理業務", rate: 80 },
          { task: "レポート作成", rate: 75 },
          { task: "顧客対応", rate: 40 },
          { task: "内部コミュニケーション", rate: 35 },
          { task: "意思決定プロセス", rate: 20 }
        ];
        
        // 年間の削減時間
        const annualHoursSaved = Math.round(currentProcessHours * 12 * (reductionRate / 100));
        
        return {
          reductionRate,
          taskEfficiencyRates,
          annualHoursSaved,
          currentProcessHours,
          automatedProcessHours: input.totalHours,
        };
      },
    },
    
    // 4. 拡張性分析
    {
      id: 'scalability-analysis',
      title: '拡張性分析',
      run: async ({ input, state, tools }) => {
        // 特徴分析に基づくスケーリングコスト評価
        const complexFeatures = input.features.filter(f => f.complexity === 'high').length;
        const totalFeatures = input.features.length;
        
        const scalingCost = complexFeatures / totalFeatures > 0.5 ? 'high' : 
                           complexFeatures / totalFeatures > 0.3 ? 'medium' : 'low';
        
        // 機能拡張コスト評価
        const extensionCost = complexFeatures / totalFeatures > 0.6 ? 'high' : 'medium';
        
        // 互換性評価（単純化のために'high'固定）
        const compatibility = 'high';
        
        // 推奨拡張機能
        const recommendedExtensions = [
          {
            name: 'モバイルアプリ連携',
            description: '現場作業者向けのモバイルアクセス機能',
            cost: Math.round(input.totalCost * 0.4),
            complexityLevel: 'medium'
          },
          {
            name: 'データ分析ダッシュボード',
            description: 'ビジネスインテリジェンス機能の追加',
            cost: Math.round(input.totalCost * 0.2),
            complexityLevel: 'low'
          }
        ];
        
        return {
          scalingCost,
          extensionCost,
          compatibility,
          recommendedExtensions,
        };
      },
    },
    
    // 5. 分析結果の総合
    {
      id: 'compile-analysis',
      title: '分析結果の総合',
      run: async ({ input, state }) => {
        return {
          estimateId: input.estimateId,
          projectName: input.projectName,
          clientName: input.clientName,
          
          // コスト最適化結果
          costOptimization: state['cost-optimization'],
          
          // ROI分析結果
          roiAnalysis: state['roi-analysis'],
          
          // 効率化予測結果
          efficiencyPrediction: state['efficiency-prediction'],
          
          // 拡張性分析結果
          scalabilityAnalysis: state['scalability-analysis'],
        };
      },
    },
  ],
});
```

### ビジネス分析ツール

ビジネス分析ワークフローをサポートするためのツールも実装します。

```typescript
// src/mastra/tools/businessAnalysisTool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const businessAnalysisTool = createTool({
  id: "business-analysis",
  description: "見積もり結果からビジネス分析（ROI、コスト最適化など）を生成します",
  inputSchema: z.object({
    estimateId: z.string(),
    industry: z.string().optional(),
    companySize: z.number().optional(),
    currentProcessHours: z.number().optional(),
  }),
  outputSchema: z.object({
    analysisId: z.string(),
    costOptimization: z.object({
      potentialSavings: z.number(),
      minimalImplementationCost: z.number(),
      prioritizedFeatures: z.array(z.any()),
    }),
    roiAnalysis: z.object({
      paybackPeriodMonths: z.number(),
      fiveYearROI: z.number(),
      annualSavings: z.number(),
      yearlyROI: z.array(z.any()),
    }),
    efficiencyPrediction: z.object({
      reductionRate: z.number(),
      annualHoursSaved: z.number(),
      taskEfficiencyRates: z.array(z.object({
        task: z.string(),
        rate: z.number(),
      })),
    }),
    scalabilityAnalysis: z.object({
      scalingCost: z.string(),
      extensionCost: z.string(),
      compatibility: z.string(),
      recommendedExtensions: z.array(z.any()),
    }),
  }),
  execute: async ({ context }) => {
    const { estimateId, industry, companySize, currentProcessHours } = context;
    
    // 見積もり情報を取得
    // const estimate = await getEstimateById(estimateId);
    
    // ビジネス分析ワークフローを実行
    const workflow = mastra.getWorkflow('businessAnalysisWorkflow');
    
    const result = await workflow.run({
      estimateId,
      // 見積もり情報
      clientName: "サンプル株式会社", // estimate.clientName,
      projectName: "業務システム開発", // estimate.projectName,
      totalHours: 350, // estimate.totalHours,
      totalCost: 3500000, // estimate.totalCost,
      features: [
        {
          name: "ユーザー認証・権限管理",
          description: "複数権限レベルを持つユーザー管理システム",
          estimatedHours: 30,
          unitPrice: 300000,
          complexity: "medium",
        },
        // その他の機能...
      ], // estimate.features,
      
      // 追加情報
      industry,
      companySize,
      currentProcessHours,
    });
    
    // DBに分析結果を保存
    // const analysisId = await saveBusinessAnalysis(result);
    const analysisId = "analysis_" + Date.now();
    
    return {
      analysisId,
      ...result,
    };
  },
});
```

### API実装: ビジネス分析

```typescript
// src/app/api/estimates/analyze-business/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mastra } from '@/mastra';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const reqData = await request.json();
    const { estimateId, industry, companySize, currentProcessHours } = reqData;
    
    // 見積もり情報を取得
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select('*')
      .eq('id', estimateId)
      .single();
      
    if (estimateError) {
      console.error('見積もり取得エラー:', estimateError);
      return NextResponse.json({ error: '見積もりの取得に失敗しました' }, { status: 500 });
    }
    
    // ビジネス分析ワークフローを実行
    const workflow = mastra.getWorkflow('businessAnalysisWorkflow');
    const result = await workflow.run({
      estimateId,
      clientName: estimate.client_name,
      projectName: estimate.project_name,
      totalHours: estimate.total_hours,
      totalCost: estimate.total_cost,
      features: estimate.features,
      industry,
      companySize,
      currentProcessHours,
    });
    
    // DBに分析結果を保存
    const { data: analysis, error: saveError } = await supabase
      .from('business_analyses')
      .insert({
        estimate_id: estimateId,
        cost_optimization: result.costOptimization,
        roi_analysis: result.roiAnalysis,
        efficiency_prediction: result.efficiencyPrediction,
        scalability_analysis: result.scalabilityAnalysis,
      })
      .select()
      .single();
      
    if (saveError) {
      console.error('分析保存エラー:', saveError);
      return NextResponse.json({ error: '分析結果の保存に失敗しました' }, { status: 500 });
    }
    
    return NextResponse.json({
      analysisId: analysis.id,
      ...result,
    });
    
  } catch (error) {
    console.error('API エラー:', error);
    return NextResponse.json(
      { error: 'ビジネス分析中にエラーが発生しました' }, 
      { status: 500 }
    );
  }
}
```

### 既存ワークフローの拡張

既存の見積もりワークフローに、オプションでビジネス分析を呼び出すステップを追加することも可能です。

```typescript
// src/mastra/workflows/estimateWorkflow.ts（一部追記）
// ... 既存のコード ...

// ビジネス分析オプション（オプション）
{
  id: 'business-analysis',
  title: 'ビジネス分析',
  optional: true,
  run: async ({ input, state, tools }) => {
    if (!input.performBusinessAnalysis) {
      return { performed: false };
    }
    
    try {
      const { analysisResult } = await tools.businessAnalysisTool({
        estimateId: state['generate-estimate'].estimateId,
        industry: input.industry,
        companySize: input.companySize,
        currentProcessHours: input.currentProcessHours,
      });
      
      return {
        performed: true,
        result: analysisResult,
      };
    } catch (error) {
      console.error('ビジネス分析エラー:', error);
      return {
        performed: false,
        error: `ビジネス分析エラー: ${error.message}`,
      };
    }
  },
},

// ... existing code ...
```

## まとめ

このドキュメントでは、Mastraフレームワークを使用した見積もりワークフローの実装方法について解説しました。主なポイントは以下の通りです：

1. ワークフローは複数のステップの連鎖として定義される
2. 各ステップは前のステップの結果を利用可能
3. ワークフローはAPIエンドポイントとして自動公開される
4. エラーハンドリングと進捗モニタリングが重要

この実装により、ユーザーからの要件入力に基づいて、体系的かつ自動的に見積もりを生成するプロセスを実現できます。これにより、見積もりプロセスの効率と一貫性が向上し、より精度の高い見積もりを短時間で提供できるようになります。 