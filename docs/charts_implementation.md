# チャート実装計画：ビジネス分析可視化

## 概要

ビジネス分析データ（ROI、コスト最適化、効率化予測、拡張性分析）を視覚的に表現するためのインタラクティブなチャートを実装します。データの視覚化により、ユーザーは複雑な情報を直感的に理解し、より良い意思決定を行うことができます。

## 技術スタック

既存の技術スタックとの互換性を考慮し、以下のライブラリを採用します：

- **Recharts**: Reactベースの軽量で柔軟なチャートライブラリ
- **React-ApexCharts**: より高度なインタラクティブチャート向け
- **TailwindCSS**: 既存のスタイリングと一貫性を保つため

## 実装対象チャート

### 1. ROI分析チャート

#### 1.1. 累積ROI折れ線グラフ

```tsx
// src/components/charts/CumulativeROIChart.tsx
'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CumulativeROIChartProps {
  yearlyROI: Array<{year: number, roi: number}>;
}

export default function CumulativeROIChart({ yearlyROI }: CumulativeROIChartProps) {
  // データポイントに円記号と％を追加
  const formattedData = yearlyROI.map(item => ({
    ...item,
    formattedROI: `${item.roi}%`
  }));

  return (
    <div className="w-full h-80 mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" label={{ value: '年数', position: 'insideBottomRight', offset: -5 }} />
          <YAxis 
            label={{ value: 'ROI (%)', angle: -90, position: 'insideLeft' }}
            domain={['dataMin', 'dataMax']}
          />
          <Tooltip formatter={(value) => [`${value}%`, 'ROI']} />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="roi" 
            stroke="#4F46E5" 
            strokeWidth={2}
            dot={{ r: 6 }}
            activeDot={{ r: 8 }}
            name="累積ROI"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 1.2. 投資回収予測ゲージチャート

```tsx
// src/components/charts/PaybackPeriodGauge.tsx
'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// APIのSSRエラーを避けるためにダイナミックインポート
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface PaybackPeriodGaugeProps {
  paybackMonths: number;
  totalMonths: number; // 通常は60ヶ月（5年）など
}

export default function PaybackPeriodGauge({ paybackMonths, totalMonths = 60 }: PaybackPeriodGaugeProps) {
  const [chartOptions, setChartOptions] = useState<any>(null);
  
  useEffect(() => {
    // クライアントサイドのみでチャートオプションを設定
    setChartOptions({
      chart: {
        type: 'radialBar',
        offsetY: -20,
      },
      plotOptions: {
        radialBar: {
          startAngle: -90,
          endAngle: 90,
          hollow: {
            margin: 0,
            size: '70%',
          },
          track: {
            background: '#e7e7e7',
            strokeWidth: '97%',
            margin: 5,
            dropShadow: {
              enabled: true,
              blur: 2,
              opacity: 0.15
            }
          },
          dataLabels: {
            name: {
              show: true,
              fontSize: '16px',
              color: '#888',
              offsetY: -10
            },
            value: {
              offsetY: -2,
              fontSize: '22px',
              color: '#111',
              formatter: function(val: number) {
                return `${Math.round(val / 100 * totalMonths)}ヶ月`;
              }
            }
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#4F46E5'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      colors: ['#FF4560'],
      stroke: {
        lineCap: 'round'
      },
      labels: ['投資回収期間']
    });
  }, [paybackMonths, totalMonths]);
  
  // ゲージの値を計算（パーセンテージで）
  const gaugeValue = Math.min(100, (paybackMonths / totalMonths) * 100);
  
  return (
    <div className="w-full h-80">
      {chartOptions && (
        <ReactApexChart 
          options={chartOptions} 
          series={[gaugeValue]} 
          type="radialBar" 
          height="100%" 
        />
      )}
    </div>
  );
}
```

### 2. コスト最適化チャート

#### 2.1. 機能優先度ドーナツチャート

```tsx
// src/components/charts/FeaturePriorityChart.tsx
'use client';

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface FeaturePriorityChartProps {
  features: Array<{
    name: string;
    unitPrice: number;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export default function FeaturePriorityChart({ features }: FeaturePriorityChartProps) {
  // 優先度ごとにグループ化して合計コストを計算
  const priorityGroups = features.reduce((acc, feature) => {
    if (!acc[feature.priority]) {
      acc[feature.priority] = {
        name: feature.priority === 'high' ? '高優先度' : 
              feature.priority === 'medium' ? '中優先度' : '低優先度',
        value: 0,
        priority: feature.priority
      };
    }
    acc[feature.priority].value += feature.unitPrice;
    return acc;
  }, {} as Record<string, { name: string; value: number; priority: string }>);
  
  const data = Object.values(priorityGroups);
  
  // 優先度ごとの色設定
  const COLORS = {
    high: '#10B981', // 緑
    medium: '#3B82F6', // 青
    low: '#F59E0B' // 黄色
  };
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            label={({ name, value, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={COLORS[entry.priority as keyof typeof COLORS]} 
              />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value) => `${value.toLocaleString()} 円`} 
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 2.2. コスト削減オプション比較バーチャート

```tsx
// src/components/charts/CostReductionChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CostReductionChartProps {
  totalCost: number;
  minimalCost: number;
  reducibleCost: number;
}

export default function CostReductionChart({ totalCost, minimalCost, reducibleCost }: CostReductionChartProps) {
  const data = [
    {
      name: '全機能',
      cost: totalCost,
    },
    {
      name: '必須機能のみ',
      cost: minimalCost,
    },
    {
      name: '推奨構成',
      cost: totalCost - reducibleCost,
    },
  ];
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
            label={{ value: 'コスト（円）', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toLocaleString()} 円`, 'コスト']}
          />
          <Legend />
          <Bar 
            dataKey="cost" 
            fill="#3B82F6" 
            name="総コスト" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

### 3. 業務効率化予測チャート

#### 3.1. 効率化率レーダーチャート

```tsx
// src/components/charts/EfficiencyRadarChart.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface EfficiencyRadarChartProps {
  taskEfficiencyRates: Array<{
    task: string;
    rate: number;
  }>;
}

export default function EfficiencyRadarChart({ taskEfficiencyRates }: EfficiencyRadarChartProps) {
  // データ形式変換
  const data = taskEfficiencyRates.map(item => ({
    subject: item.task,
    A: item.rate,
    fullMark: 100
  }));
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          <Radar
            name="効率化率"
            dataKey="A"
            stroke="#8B5CF6"
            fill="#8B5CF6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 3.2. 年間削減時間棒グラフ

```tsx
// src/components/charts/TimeSavingsChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

interface TimeSavingsChartProps {
  currentProcessHours: number;
  automatedProcessHours: number;
  annualHoursSaved: number;
}

export default function TimeSavingsChart({ 
  currentProcessHours, 
  automatedProcessHours, 
  annualHoursSaved 
}: TimeSavingsChartProps) {
  const data = [
    {
      name: '導入前',
      hours: currentProcessHours * 12, // 年間時間に変換
    },
    {
      name: '導入後',
      hours: (currentProcessHours - automatedProcessHours) * 12,
    },
  ];
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: '年間工数（時間）', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => [`${value.toLocaleString()} 時間`, '年間工数']}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#000" />
          <Bar 
            dataKey="hours" 
            fill="#8B5CF6" 
            name="年間工数" 
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <span className="font-medium text-purple-600">年間削減時間: {annualHoursSaved.toLocaleString()} 時間</span>
      </div>
    </div>
  );
}
```

### 4. 拡張性分析チャート

#### 4.1. 拡張機能コスト比較横棒グラフ

```tsx
// src/components/charts/ExtensionCostChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ExtensionCostChartProps {
  recommendedExtensions: Array<{
    name: string;
    cost: number;
    complexityLevel: string;
  }>;
  baseCost: number; // 基本見積もりコスト
}

export default function ExtensionCostChart({ recommendedExtensions, baseCost }: ExtensionCostChartProps) {
  // 基本コストを含めたデータ作成
  const data = [
    {
      name: '基本機能',
      cost: baseCost,
      fill: '#3B82F6'
    },
    ...recommendedExtensions.map(ext => ({
      name: ext.name,
      cost: ext.cost,
      fill: ext.complexityLevel === 'low' ? '#10B981' : 
            ext.complexityLevel === 'medium' ? '#F59E0B' : '#EF4444'
    }))
  ];
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            tickFormatter={(value) => `${(value / 10000).toFixed(0)}万`}
          />
          <YAxis 
            type="category" 
            dataKey="name" 
          />
          <Tooltip 
            formatter={(value) => [`${value.toLocaleString()} 円`, 'コスト']}
          />
          <Legend />
          <Bar 
            dataKey="cost" 
            name="コスト" 
            radius={[0, 4, 4, 0]}
            // カスタムFill
            // @ts-ignore - fillプロパティがデータに含まれていると認識されていない
            fill={(entry) => entry.fill}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

#### 4.2. スケーラビリティ評価レーダーチャート

```tsx
// src/components/charts/ScalabilityRadarChart.tsx
'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface ScalabilityRadarChartProps {
  scalabilityData: {
    userScaling: number;
    dataScaling: number;
    featureExtension: number;
    thirdPartyIntegration: number;
    maintenanceCost: number;
  };
}

export default function ScalabilityRadarChart({ scalabilityData }: ScalabilityRadarChartProps) {
  // データを変換
  const data = [
    { subject: 'ユーザー拡張性', A: scalabilityData.userScaling, fullMark: 100 },
    { subject: 'データ拡張性', A: scalabilityData.dataScaling, fullMark: 100 },
    { subject: '機能拡張性', A: scalabilityData.featureExtension, fullMark: 100 },
    { subject: '外部連携', A: scalabilityData.thirdPartyIntegration, fullMark: 100 },
    { subject: '保守性', A: scalabilityData.maintenanceCost, fullMark: 100 },
  ];
  
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={90} domain={[0, 100]} />
          <Radar
            name="拡張性評価"
            dataKey="A"
            stroke="#14B8A6"
            fill="#14B8A6"
            fillOpacity={0.6}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
```

## ライブラリのインストール

```bash
npm install recharts react-apexcharts apexcharts
# または
yarn add recharts react-apexcharts apexcharts
```

## チャートコンポーネントの統合

これらのチャートを詳細分析タブに統合するコード例：

```tsx
// src/components/estimates/BusinessAnalysisTab.tsx
'use client';

import { useState } from 'react';
import CumulativeROIChart from '@/components/charts/CumulativeROIChart';
import PaybackPeriodGauge from '@/components/charts/PaybackPeriodGauge';
import FeaturePriorityChart from '@/components/charts/FeaturePriorityChart';
import CostReductionChart from '@/components/charts/CostReductionChart';
import EfficiencyRadarChart from '@/components/charts/EfficiencyRadarChart';
import TimeSavingsChart from '@/components/charts/TimeSavingsChart';
import ExtensionCostChart from '@/components/charts/ExtensionCostChart';
import ScalabilityRadarChart from '@/components/charts/ScalabilityRadarChart';

interface BusinessAnalysisTabProps {
  analysisData: any; // ビジネス分析データ
}

export default function BusinessAnalysisTab({ analysisData }: BusinessAnalysisTabProps) {
  const [activeSection, setActiveSection] = useState('roi');
  
  if (!analysisData) return <div>分析データがありません</div>;
  
  return (
    <div className="space-y-6">
      {/* セクション選択ナビゲーション */}
      <div className="flex space-x-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveSection('roi')}
          className={`px-3 py-2 rounded-t-lg ${
            activeSection === 'roi' 
              ? 'bg-indigo-100 text-indigo-700 font-medium' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          投資回収分析
        </button>
        <button
          onClick={() => setActiveSection('optimization')}
          className={`px-3 py-2 rounded-t-lg ${
            activeSection === 'optimization' 
              ? 'bg-blue-100 text-blue-700 font-medium' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          コスト最適化
        </button>
        <button
          onClick={() => setActiveSection('efficiency')}
          className={`px-3 py-2 rounded-t-lg ${
            activeSection === 'efficiency' 
              ? 'bg-purple-100 text-purple-700 font-medium' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          業務効率化
        </button>
        <button
          onClick={() => setActiveSection('scalability')}
          className={`px-3 py-2 rounded-t-lg ${
            activeSection === 'scalability' 
              ? 'bg-teal-100 text-teal-700 font-medium' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          拡張性分析
        </button>
      </div>
      
      {/* ROI分析セクション */}
      {activeSection === 'roi' && (
        <div className="space-y-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700">投資回収期間</h3>
            <PaybackPeriodGauge 
              paybackMonths={analysisData.roiAnalysis.paybackPeriodMonths} 
              totalMonths={60} 
            />
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-indigo-700">累積ROI予測</h3>
            <CumulativeROIChart yearlyROI={analysisData.roiAnalysis.yearlyROI} />
          </div>
        </div>
      )}
      
      {/* コスト最適化セクション */}
      {activeSection === 'optimization' && (
        <div className="space-y-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">機能優先度分析</h3>
            <FeaturePriorityChart 
              features={analysisData.costOptimization.prioritizedFeatures} 
            />
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-blue-700">コスト削減オプション</h3>
            <CostReductionChart 
              totalCost={analysisData.totalCost}
              minimalCost={analysisData.costOptimization.minimalImplementationCost}
              reducibleCost={analysisData.costOptimization.potentialSavings}
            />
          </div>
        </div>
      )}
      
      {/* 業務効率化セクション */}
      {activeSection === 'efficiency' && (
        <div className="space-y-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">業務別効率化率</h3>
            <EfficiencyRadarChart 
              taskEfficiencyRates={analysisData.efficiencyPrediction.taskEfficiencyRates} 
            />
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-purple-700">年間工数削減</h3>
            <TimeSavingsChart 
              currentProcessHours={analysisData.efficiencyPrediction.currentProcessHours}
              automatedProcessHours={analysisData.efficiencyPrediction.automatedProcessHours}
              annualHoursSaved={analysisData.efficiencyPrediction.annualHoursSaved}
            />
          </div>
        </div>
      )}
      
      {/* 拡張性分析セクション */}
      {activeSection === 'scalability' && (
        <div className="space-y-8">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-teal-700">システム拡張性評価</h3>
            <ScalabilityRadarChart 
              scalabilityData={{
                userScaling: analysisData.scalabilityAnalysis.scalingCost === 'low' ? 90 : 
                             analysisData.scalabilityAnalysis.scalingCost === 'medium' ? 70 : 50,
                dataScaling: analysisData.scalabilityAnalysis.scalingCost === 'low' ? 85 : 
                            analysisData.scalabilityAnalysis.scalingCost === 'medium' ? 65 : 45,
                featureExtension: analysisData.scalabilityAnalysis.extensionCost === 'low' ? 85 : 
                                 analysisData.scalabilityAnalysis.extensionCost === 'medium' ? 65 : 45,
                thirdPartyIntegration: analysisData.scalabilityAnalysis.compatibility === 'high' ? 90 : 
                                      analysisData.scalabilityAnalysis.compatibility === 'medium' ? 70 : 50,
                maintenanceCost: 75 // デフォルト値
              }} 
            />
          </div>
          
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4 text-teal-700">推奨拡張機能コスト</h3>
            <ExtensionCostChart 
              recommendedExtensions={analysisData.scalabilityAnalysis.recommendedExtensions}
              baseCost={analysisData.totalCost}
            />
          </div>
        </div>
      )}
    </div>
  );
}
```

## 導入手順

1. 必要なライブラリをインストール
2. 各チャートコンポーネントを実装
3. 既存の`EstimateResult.tsx`にあるビジネス分析タブを上記の`BusinessAnalysisTab`コンポーネントに置き換え
4. バックエンドAPIからのデータ形式に応じてチャートコンポーネントのpropsを調整

## データ連携

チャートはAPIから取得したビジネス分析データを使用します。最低限必要なデータ構造の例：

```typescript
interface BusinessAnalysisData {
  // ROI分析
  roiAnalysis: {
    paybackPeriodMonths: number;
    fiveYearROI: number;
    annualSavings: number;
    yearlyROI: Array<{year: number, roi: number}>;
  };
  
  // コスト最適化
  costOptimization: {
    potentialSavings: number;
    minimalImplementationCost: number;
    prioritizedFeatures: Array<{
      name: string;
      unitPrice: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  };
  
  // 効率化分析
  efficiencyPrediction: {
    reductionRate: number;
    annualHoursSaved: number;
    currentProcessHours: number;
    automatedProcessHours: number;
    taskEfficiencyRates: Array<{
      task: string;
      rate: number;
    }>;
  };
  
  // 拡張性分析
  scalabilityAnalysis: {
    scalingCost: 'low' | 'medium' | 'high';
    extensionCost: 'low' | 'medium' | 'high';
    compatibility: 'low' | 'medium' | 'high';
    recommendedExtensions: Array<{
      name: string;
      cost: number;
      complexityLevel: 'low' | 'medium' | 'high';
    }>;
  };
  
  // 基本情報
  totalCost: number;
}
```

## パフォーマンス最適化

1. チャートコンポーネントをLazy Loadingで読み込み（特にApexChartsなど重いライブラリ）
2. データサイズが大きい場合は、必要なデータのみをフェッチする
3. タブ切り替え時にのみチャートをレンダリングし、不要な再計算を避ける
4. React.memo()を使用して不要な再レンダリングを防止

## レスポンシブ対応

全てのチャートは`ResponsiveContainer`を使用してレスポンシブ対応しています。追加の微調整が必要な場合：

- モバイル表示では一部のチャート要素（凡例など）の配置を調整
- 画面サイズに応じてチャートの高さや余白を変更
- 小さい画面ではタッチインタラクションを改善

## アクセシビリティ対応

チャートのアクセシビリティを向上させるための対応：

1. 色覚異常者のための色選択（コントラスト比に配慮）
2. スクリーンリーダー対応のaria属性追加
3. キーボードナビゲーション対応
4. チャート下部にテーブル形式のデータ（非表示・スクリーンリーダー用）を追加

## まとめ

これらのインタラクティブなチャートを実装することで、見積もりシステムのUXが大幅に向上します。ユーザーは数値データを視覚的に把握でき、より情報に基づいた意思決定が可能になります。特に経営層向けのプレゼンテーションやビジネス価値の説明において、グラフとチャートは重要な役割を果たします。
