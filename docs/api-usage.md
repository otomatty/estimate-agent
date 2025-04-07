# 見積もりシステムAPI利用ガイド

## 概要

このドキュメントでは、業務システム自動見積もりAPIの利用方法について説明します。APIを使用することで、独自のシステムから見積もり機能を利用できます。

## 認証

すべてのAPIリクエストには認証が必要です。APIキーをリクエストヘッダーに含めてください。

```bash
X-API-KEY: your-api-key-here
```

**注意:** APIキーは秘密情報として扱い、公開リポジトリにコミットしないでください。

## エンドポイント

### 基本URL

```
本番環境: https://api.estimate-system.example.com/v1
ステージング環境: https://staging-api.estimate-system.example.com/v1
```

## 基本的な使用例

### 1. 新規見積もりの作成

```typescript
// 新規見積もりの作成例
const createEstimate = async () => {
  const response = await fetch('https://api.estimate-system.example.com/v1/estimates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': 'your-api-key-here'
    },
    body: JSON.stringify({
      requirements: '顧客管理システムの開発。顧客情報の登録、検索、編集機能が必要。',
      clientName: '株式会社サンプル',
      projectName: '顧客管理システム開発'
    })
  });

  const data = await response.json();
  const estimateId = data.estimateId;
  // 以降の処理でestimateIdを使用
};
```

### 2. 質問への回答

```typescript
// システムからの質問に回答する例
const answerQuestions = async (estimateId: string) => {
  // まず質問を取得
  const questionsResponse = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/questions`,
    {
      headers: {
        'X-API-KEY': 'your-api-key-here'
      }
    }
  );
  
  const questions = await questionsResponse.json();
  
  // 質問に回答
  const answers = questions.questions.map(q => ({
    questionId: q.id,
    answer: '回答内容をここに' // 実際のユーザー入力に置き換え
  }));
  
  const answerResponse = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/questions`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key-here'
      },
      body: JSON.stringify({ answers })
    }
  );
  
  const result = await answerResponse.json();
  if (result.isComplete) {
    // 質問フェーズ完了、次のステップへ
  }
};
```

### 3. 機能の選択と更新

```typescript
// 提案された機能の選択例
const updateFeatures = async (estimateId: string) => {
  // 機能一覧を取得
  const featuresResponse = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/features`,
    {
      headers: {
        'X-API-KEY': 'your-api-key-here'
      }
    }
  );
  
  const features = await featuresResponse.json();
  
  // 機能の選択状態を更新
  const updateResponse = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/features`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'your-api-key-here'
      },
      body: JSON.stringify({
        items: features.map(f => ({
          id: f.id,
          isSelected: true // ユーザーの選択に基づいて true/false
        }))
      })
    }
  );
  
  const result = await updateResponse.json();
  console.log(`更新後の見積もり総額: ${result.totalAmount}円`);
};
```

### 4. 見積書PDFの取得

```typescript
// 見積書PDFの取得例
const getPdf = async (estimateId: string) => {
  const response = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/pdf`,
    {
      headers: {
        'X-API-KEY': 'your-api-key-here'
      }
    }
  );
  
  const data = await response.json();
  const pdfUrl = data.pdfUrl;
  // PDFのURLを使用して表示やダウンロード
};
```

### 5. ビジネス分析データの取得

```typescript
// ビジネス分析データの取得例
const getBusinessAnalysis = async (estimateId: string) => {
  const response = await fetch(
    `https://api.estimate-system.example.com/v1/estimates/${estimateId}/business-analysis`,
    {
      headers: {
        'X-API-KEY': 'your-api-key-here'
      }
    }
  );
  
  const analysis = await response.json();
  // ROI、コスト最適化、効率化指標などのデータを使用
};
```

## 一般的な利用フロー

1. 新規見積もり作成
2. システムからの質問に回答
3. 提案された機能の確認と選択
4. 見積書PDFの生成
5. （オプション）ビジネス分析データの取得

## エラーハンドリング

APIは以下の形式でエラーを返します：

```json
{
  "code": "ERROR_CODE",
  "message": "エラーの説明",
  "details": {
    // エラーの詳細情報
  }
}
```

主なエラーコード：

- `INVALID_REQUEST`: リクエストの形式が不正
- `AUTHENTICATION_ERROR`: 認証エラー
- `NOT_FOUND`: リソースが見つからない
- `VALIDATION_ERROR`: バリデーションエラー
- `INTERNAL_ERROR`: サーバー内部エラー

## レート制限

- 1分あたり60リクエストまで
- 超過した場合は429 Too Many Requestsを返却
- `X-RateLimit-Remaining`ヘッダーで残りリクエスト数を確認可能

## ベストプラクティス

1. **エラーハンドリング**
   - すべてのAPIコールでエラーハンドリングを実装
   - ネットワークエラーやタイムアウトへの対応
   - リトライロジックの実装（推奨）

```typescript
const callApi = async (url: string, options: RequestInit) => {
  const maxRetries = 3;
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          'X-API-KEY': 'your-api-key-here'
        }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      return await response.json();
    } catch (error) {
      attempt++;
      if (attempt === maxRetries) throw error;
      // 指数バックオフ
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
};
```

2. **キャッシュの活用**
   - 頻繁に変更されないデータはクライアント側でキャッシュ
   - `If-Modified-Since`ヘッダーの使用

3. **バッチ処理**
   - 複数の機能更新は1回のリクエストにまとめる
   - 不要なAPI呼び出しを避ける

## セキュリティ上の注意

1. APIキーの管理
   - 環境変数として管理
   - 定期的なローテーション
   - 本番環境とステージング環境で別のキーを使用

2. HTTPS通信
   - 必ずHTTPSで通信
   - 証明書の検証を無効化しない

3. データの検証
   - クライアント側でもバリデーションを実装
   - 機密情報の適切な処理

## トラブルシューティング

よくある問題と解決方法：

1. **認証エラー**
   - APIキーの有効期限確認
   - ヘッダー名の大文字小文字を確認
   - キーの値が正しくエンコードされているか確認

2. **レート制限エラー**
   - リクエスト頻度の確認
   - キャッシュの活用
   - バッチ処理の検討

3. **タイムアウト**
   - ネットワーク接続の確認
   - リクエストサイズの最適化
   - 長時間処理の分割

## サポート

技術的な質問やバグ報告は以下の方法で行えます：

- メール: support@example.com
- 開発者フォーラム: https://forum.example.com
- GitHub Issues: https://github.com/example/estimate-api/issues

---

**注意:** このドキュメントは定期的に更新されます。最新の情報は必ずAPI仕様書と合わせて確認してください。 