# 見積もりエージェント テストアプリケーション

Supabaseを使った業務システム自動見積もりエージェントのテスト用アプリケーションです。

## 機能

- 見積もりの作成・表示
- 質問生成と回答
- 見積もり項目の作成と選択
- 合計金額の計算
- メールアドレスの登録

## セットアップ手順

### 前提条件

- Node.js 16以上
- Supabaseプロジェクト（データベースが既に設定されていること）

### インストール

```bash
# リポジトリをクローン（または任意の方法でコードを取得）
git clone <このリポジトリのURL>
cd estimate-agent-test

# 依存パッケージをインストール
npm install
```

### 環境設定

`.env`ファイルをプロジェクトルートに作成し、Supabaseの接続情報を設定してください：

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### ビルド

```bash
npm run build
```

## 使い方

### セットアップ

最初に、テスト用のデータをセットアップします：

```bash
node dist/index.js setup
```

これにより、質問テンプレートなどの初期データが作成されます。

### 基本的なコマンド

ヘルプを表示：

```bash
node dist/index.js help
```

新しい見積もりを作成：

```bash
node dist/index.js create-estimate --title "テスト見積もり" --requirements "倉庫管理システムが欲しいです"
```

見積もり一覧を表示：

```bash
node dist/index.js list-estimates
```

特定の見積もりの詳細を表示：

```bash
node dist/index.js list-estimates --session <セッションID> --verbose
```

### 見積もりフローのテスト

全ての見積もりプロセスを自動的にテストするには：

```bash
npm run test
```

これにより以下の処理が順番に実行されます：

1. 初期見積もり作成
2. 質問テンプレート作成
3. 質問生成
4. 質問への回答
5. 見積もり項目作成
6. 見積もり項目の選択
7. 合計金額更新
8. メールアドレス登録

## プロジェクト構成

```
estimate-agent-test/
├── src/               # ソースコード
│   ├── models/        # データモデル
│   │   └── types.ts   # 型定義
│   ├── services/      # ビジネスロジック
│   │   ├── estimate.service.ts  # 見積もり関連のサービス
│   │   └── question.service.ts  # 質問関連のサービス
│   ├── utils/         # ユーティリティ
│   ├── supabase.ts    # Supabase接続
│   ├── index.ts       # エントリーポイント
│   └── test.ts        # テスト実行
├── dist/              # コンパイル後のファイル
├── .env               # 環境変数
├── package.json       # 依存関係
├── tsconfig.json      # TypeScript設定
└── README.md          # このファイル
```

## 開発用コマンド

開発モードで実行：

```bash
npm run dev
```

ビルド：

```bash
npm run build
```

テスト実行：

```bash
npm run test
```

## 注意事項

- このアプリケーションはテスト用で、本番環境での使用は想定していません。
- 一時見積もりデータは7日後に自動的に削除されます。
- メール通知はテスト用のためメールは実際には送信されません。
- `set_app_setting`関数がSupabaseプロジェクトにないとセッションIDが正しく設定されない場合があります。

## ライセンス

[MIT](LICENSE) 