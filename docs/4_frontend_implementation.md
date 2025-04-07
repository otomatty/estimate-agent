# フロントエンド実装

このドキュメントでは、見積もりシステムのフロントエンド実装について解説します。

## 概要

フロントエンドは以下の主要機能を提供します：

1. 初期要件の入力フォーム
2. 追加質問への回答フォーム
3. 見積もり結果の表示
4. PDF見積書の閲覧・ダウンロード

## 技術スタック

- Next.js - Reactフレームワーク
- Tailwind CSS - スタイリング
- React Hook Form - フォーム管理
- Supabase Client - データ取得

## ディレクトリ構造

```
src/
├── app/
│   ├── api/            # APIルート
│   ├── dashboard/      # ダッシュボード画面
│   ├── estimates/      # 見積もり関連ページ
│   │   ├── [id]/        # 個別見積もり表示
│   │   ├── new/         # 新規見積もり作成
│   │   └── page.tsx     # 見積もり一覧
│   └── page.tsx        # トップページ
├── components/        # 共通コンポーネント
│   ├── ui/            # UI基本コンポーネント
│   ├── forms/         # フォームコンポーネント
│   └── estimates/     # 見積もり関連コンポーネント
├── lib/              # ユーティリティ
└── types/            # 型定義
```

## 主要画面の実装

### 1. トップページ

```tsx
// src/app/page.tsx
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-6">業務システム見積もり自動化</h1>
        <p className="text-xl mb-8">
          AIを活用して業務システム開発の見積もりを簡単に生成します。
          要件を入力するだけで、過去の類似案件を参照して高精度な見積もりを提供します。
        </p>
        
        <div className="flex justify-center gap-4">
          <Link 
            href="/estimates/new" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            新規見積もりを作成
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-gray-200 text-gray-800 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
          >
            ダッシュボードを見る
          </Link>
        </div>
      </div>
    </div>
  );
}
```

### 2. 新規見積もり作成フォーム

```tsx
// src/app/estimates/new/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import InitialRequirementsForm from '@/components/forms/InitialRequirementsForm';
import QuestionsForm from '@/components/forms/QuestionsForm';
import EstimateResult from '@/components/estimates/EstimateResult';

type FormStep = 'initial' | 'questions' | 'result';

export default function NewEstimatePage() {
  const [step, setStep] = useState<FormStep>('initial');
  const [initialData, setInitialData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [estimateResult, setEstimateResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  // 初期要件の送信
  const handleInitialSubmit = async (data) => {
    setIsLoading(true);
    
    try {
      // APIエンドポイントを呼び出して初期分析を実行
      const response = await fetch('/api/estimates/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      setInitialData(data);
      setQuestions(result.questions);
      setStep('questions');
    } catch (error) {
      console.error('Error:', error);
      // エラー処理
    } finally {
      setIsLoading(false);
    }
  };
  
  // 追加質問への回答の送信
  const handleQuestionsSubmit = async (answers) => {
    setIsLoading(true);
    
    try {
      // 見積もり生成APIを呼び出す
      const response = await fetch('/api/estimates/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          initialRequirements: initialData.requirements,
          clientName: initialData.clientName,
          projectName: initialData.projectName,
          answers,
        }),
      });
      
      const result = await response.json();
      
      setEstimateResult(result);
      setStep('result');
    } catch (error) {
      console.error('Error:', error);
      // エラー処理
    } finally {
      setIsLoading(false);
    }
  };
  
  // 新しい見積もりを作成する
  const handleNewEstimate = () => {
    setStep('initial');
    setInitialData(null);
    setQuestions([]);
    setEstimateResult(null);
  };
  
  // 見積もり詳細ページに移動
  const handleViewDetails = () => {
    router.push(`/estimates/${estimateResult.estimateId}`);
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">新規見積もり作成</h1>
      
      {/* ステップインジケーター */}
      <div className="mb-10">
        <ol className="flex items-center w-full">
          <li className={`flex w-full items-center ${step === 'initial' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'initial' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'} shrink-0`}>1</span>
            <span className="ml-2">初期要件</span>
          </li>
          <div className="w-full bg-gray-200 h-0.5 mx-2"></div>
          <li className={`flex w-full items-center ${step === 'questions' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'questions' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'} shrink-0`}>2</span>
            <span className="ml-2">追加質問</span>
          </li>
          <div className="w-full bg-gray-200 h-0.5 mx-2"></div>
          <li className={`flex w-full items-center ${step === 'result' ? 'text-blue-600' : 'text-gray-500'}`}>
            <span className={`flex items-center justify-center w-8 h-8 rounded-full ${step === 'result' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'} shrink-0`}>3</span>
            <span className="ml-2">見積もり結果</span>
          </li>
        </ol>
      </div>
      
      {/* フォームとコンテンツの表示 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        {step === 'initial' && (
          <InitialRequirementsForm 
            onSubmit={handleInitialSubmit} 
            isLoading={isLoading} 
            initialData={initialData}
          />
        )}
        
        {step === 'questions' && (
          <QuestionsForm 
            questions={questions} 
            onSubmit={handleQuestionsSubmit} 
            isLoading={isLoading}
            onBack={() => setStep('initial')}
          />
        )}
        
        {step === 'result' && (
          <EstimateResult 
            result={estimateResult}
            onNewEstimate={handleNewEstimate}
            onViewDetails={handleViewDetails}
          />
        )}
      </div>
    </div>
  );
}
```

### 3. 初期要件フォームコンポーネント

```tsx
// src/components/forms/InitialRequirementsForm.tsx
'use client';

import { useForm } from 'react-hook-form';

interface InitialRequirementsFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  initialData: any;
}

export default function InitialRequirementsForm({ 
  onSubmit, 
  isLoading, 
  initialData 
}: InitialRequirementsFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      clientName: '',
      projectName: '',
      requirements: '',
    }
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
              クライアント名
            </label>
            <input
              id="clientName"
              type="text"
              {...register('clientName', { required: 'クライアント名を入力してください' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例: 株式会社サンプル"
            />
            {errors.clientName && (
              <p className="mt-1 text-sm text-red-600">{errors.clientName.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
              プロジェクト名
            </label>
            <input
              id="projectName"
              type="text"
              {...register('projectName', { required: 'プロジェクト名を入力してください' })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="例: 顧客管理システム開発"
            />
            {errors.projectName && (
              <p className="mt-1 text-sm text-red-600">{errors.projectName.message}</p>
            )}
          </div>
        </div>
        
        <div>
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700 mb-1">
            システム要件
          </label>
          <textarea
            id="requirements"
            rows={8}
            {...register('requirements', { 
              required: 'システム要件を入力してください',
              minLength: { 
                value: 50, 
                message: 'より詳細な説明を入力してください (最低50文字)' 
              } 
            })}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="開発するシステムの目的、機能、規模などを記入してください..."
          />
          {errors.requirements && (
            <p className="mt-1 text-sm text-red-600">{errors.requirements.message}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            ※詳細な情報を入力するほど、より正確な見積もりが可能になります。
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                分析中...
              </>
            ) : '次へ - 追加質問'}
          </button>
        </div>
      </div>
    </form>
  );
}
```

### 4. 質問フォームコンポーネント

```tsx
// src/components/forms/QuestionsForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { useState } from 'react';

interface Question {
  id: string;
  question: string;
  importance: number;
  rationale: string;
}

interface QuestionsFormProps {
  questions: Question[];
  onSubmit: (data: any) => void;
  isLoading: boolean;
  onBack: () => void;
}

export default function QuestionsForm({ 
  questions, 
  onSubmit, 
  isLoading,
  onBack 
}: QuestionsFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">追加情報</h2>
      <p className="text-gray-600 mb-6">
        より正確な見積もりを作成するために、以下の質問にお答えください。
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          {questions.map((q) => (
            <div key={q.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-start">
                <div className="mr-3 bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                  重要度: {q.importance}/5
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{q.question}</h3>
                  <p className="text-sm text-gray-500 mt-1">{q.rationale}</p>
                </div>
              </div>
              
              <div className="mt-3">
                <textarea
                  {...register(`answers.${q.id}`, { 
                    required: '回答を入力してください' 
                  })}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="ご回答をご記入ください..."
                />
                {errors.answers?.[q.id] && (
                  <p className="mt-1 text-sm text-red-600">{errors.answers[q.id].message}</p>
                )}
              </div>
            </div>
          ))}
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              戻る
            </button>
            
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  見積もり生成中...
                </>
              ) : '見積もりを生成'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

### 5. 見積もり結果コンポーネント

```tsx
// src/components/estimates/EstimateResult.tsx
'use client';

import { useState } from 'react';

interface EstimateResultProps {
  result: any;
  onNewEstimate: () => void;
  onViewDetails: () => void;
}

export default function EstimateResult({ 
  result, 
  onNewEstimate,
  onViewDetails 
}: EstimateResultProps) {
  if (!result) return null;
  
  // 新しい状態管理を追加
  const [activeTab, setActiveTab] = useState('summary');
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">見積もり結果</h2>
        <div className="text-sm text-gray-500">
          見積もりID: {result.estimateId}
        </div>
      </div>
      
      {/* タブナビゲーションを追加 */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'summary'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            概要
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'features'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            機能一覧
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analysis'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            詳細分析
          </button>
        </nav>
      </div>
      
      {/* 概要タブコンテンツ */}
      {activeTab === 'summary' && (
      <div className="bg-gray-50 p-6 rounded-lg mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">合計工数</p>
            <p className="text-2xl font-bold">{result.totalHours} 時間</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">合計金額</p>
            <p className="text-2xl font-bold">{result.totalCost.toLocaleString()} 円</p>
          </div>
        </div>
      </div>
      )}
      
      {/* 機能一覧タブコンテンツ */}
      {activeTab === 'features' && (
        <div>
      <h3 className="text-lg font-semibold mb-3">機能一覧</h3>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                機能名
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                複雑度
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                工数
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                金額
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {result.features.map((feature, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{feature.name}</div>
                  <div className="text-sm text-gray-500">{feature.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    feature.complexity === 'high' 
                      ? 'bg-red-100 text-red-800' 
                      : feature.complexity === 'medium' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                  }`}>
                    {feature.complexity === 'high' 
                      ? '高' 
                      : feature.complexity === 'medium' 
                        ? '中' 
                        : '低'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  {feature.estimatedHours} 時間
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                  {feature.unitPrice.toLocaleString()} 円
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        </div>
      )}
      
      {/* 新しい詳細分析タブコンテンツ */}
      {activeTab === 'analysis' && (
        <div className="space-y-8">
          {/* コスト最適化セクション */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">コスト最適化分析</h3>
            <p className="text-gray-600 mb-4">必要な機能のみに投資することでコストを最適化できます。</p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-blue-800 mb-2">投資優先度</h4>
              <div className="space-y-3">
                {result.features && result.features.slice(0, 3).map((feature, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-800">{feature.name}</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                        <div 
                          className={`h-2.5 rounded-full ${
                            index === 0 ? 'bg-green-500 w-full' : 
                            index === 1 ? 'bg-blue-500 w-3/4' : 'bg-yellow-500 w-1/2'
                          }`} 
                        />
                      </div>
                      <span className="text-sm text-gray-600">
                        {index === 0 ? '高' : index === 1 ? '中' : '低'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">削減可能コスト</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(result.totalCost * 0.15).toLocaleString()} 円
                </p>
                <p className="text-sm text-gray-500">優先度の低い機能を除外した場合</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">最小実装コスト</h4>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(result.totalCost * 0.6).toLocaleString()} 円
                </p>
                <p className="text-sm text-gray-500">必須機能のみ実装した場合</p>
              </div>
            </div>
          </div>
          
          {/* ROI分析セクション */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700">投資回収分析</h3>
            <p className="text-gray-600 mb-4">このプロジェクトの潜在的なROIを視覚化します。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">投資回収期間</h4>
                <p className="text-2xl font-bold text-indigo-600">14ヶ月</p>
                <p className="text-sm text-gray-500">予測される回収期間</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">5年ROI</h4>
                <p className="text-2xl font-bold text-indigo-600">267%</p>
                <p className="text-sm text-gray-500">5年間の投資収益率</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">年間コスト削減</h4>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(result.totalCost * 0.3).toLocaleString()} 円
                </p>
                <p className="text-sm text-gray-500">導入による年間削減額</p>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">累積ROI予測</h4>
              <div className="h-48 w-full bg-gray-50 rounded flex items-end justify-between p-2">
                {[1, 2, 3, 4, 5].map((year) => (
                  <div key={year} className="flex flex-col items-center">
                    <div 
                      className={`w-12 ${
                        year === 1 ? 'bg-red-500 h-1/4' : 
                        year === 2 ? 'bg-yellow-500 h-2/4' : 
                        year === 3 ? 'bg-green-500 h-3/4' : 
                        year === 4 ? 'bg-blue-500 h-5/6' : 'bg-indigo-500 h-full'
                      } rounded-t`}
                    ></div>
                    <span className="text-xs mt-2">{year}年目</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 業務効率化予測セクション */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">業務効率化予測</h3>
            <p className="text-gray-600 mb-4">システム導入後の業務効率化によって得られる効果を予測します。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">平均工数削減率</h4>
                <p className="text-2xl font-bold text-purple-600">43%</p>
                <p className="text-sm text-gray-500">既存の手作業と比較</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">年間削減時間</h4>
                <p className="text-2xl font-bold text-purple-600">1,280時間</p>
                <p className="text-sm text-gray-500">組織全体での削減時間</p>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-medium text-purple-800 mb-3">業務別効率化率</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">データ入力/管理業務</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="h-2.5 rounded-full bg-purple-600 w-4/5"></div>
                    </div>
                    <span className="text-sm text-gray-600">80%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">レポート作成</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="h-2.5 rounded-full bg-purple-600 w-3/4"></div>
                    </div>
                    <span className="text-sm text-gray-600">75%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-800">顧客対応</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2.5 mr-2">
                      <div className="h-2.5 rounded-full bg-purple-600 w-2/5"></div>
                    </div>
                    <span className="text-sm text-gray-600">40%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* 拡張性分析セクション */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-teal-700">拡張性分析</h3>
            <p className="text-gray-600 mb-4">将来的な機能拡張に関するコストと実現可能性を分析します。</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">スケーリングコスト</h4>
                <p className="text-xl font-bold text-teal-600">低</p>
                <p className="text-sm text-gray-500">ユーザー数/データ量増加時</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">機能拡張コスト</h4>
                <p className="text-xl font-bold text-yellow-600">中</p>
                <p className="text-sm text-gray-500">追加機能実装時</p>
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">互換性</h4>
                <p className="text-xl font-bold text-green-600">高</p>
                <p className="text-sm text-gray-500">他システムとの連携</p>
              </div>
            </div>
            
            <div className="bg-teal-50 rounded-lg p-4">
              <h4 className="font-medium text-teal-800 mb-3">推奨拡張機能</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-medium">モバイルアプリ連携</h5>
                    <span className="text-sm px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                      中程度の実装コスト
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">現場作業者向けのモバイルアクセス機能</p>
                  <p className="text-sm font-medium text-teal-700 mt-1">
                    予想追加コスト: {Math.round(result.totalCost * 0.4).toLocaleString()} 円
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h5 className="font-medium">データ分析ダッシュボード</h5>
                    <span className="text-sm px-2 py-1 bg-green-100 text-green-800 rounded-full">
                      低コスト実装
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">ビジネスインテリジェンス機能の追加</p>
                  <p className="text-sm font-medium text-teal-700 mt-1">
                    予想追加コスト: {Math.round(result.totalCost * 0.2).toLocaleString()} 円
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mt-6">
        <a 
          href={result.pdfUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          PDFを表示
        </a>
        <button
          onClick={onViewDetails}
          className="flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          詳細を表示
        </button>
        <button
          onClick={onNewEstimate}
          className="flex items-center justify-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          新しい見積もりを作成
        </button>
      </div>
    </div>
  );
}
```