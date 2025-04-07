# Supabase MCPサーバー使用ガイド

## 概要

Supabase MCPサーバーは、SupabaseプロジェクトをAIアシスタントに接続するためのツールです。Model Context Protocol（MCP）を使用して、LLMがSupabaseプロジェクトと直接やり取りできるようにします。

## 利用可能なツール

### プロジェクト管理

| ツール | 説明 |
|--------|------|
| `list_projects` | ユーザーのすべてのSupabaseプロジェクトを一覧表示 |
| `get_project` | プロジェクトの詳細を取得 |
| `create_project` | 新しいSupabaseプロジェクトを作成 |
| `pause_project` | プロジェクトを一時停止 |
| `restore_project` | プロジェクトを復元 |
| `list_organizations` | ユーザーが所属する組織の一覧表示 |
| `get_organization` | 組織の詳細を取得 |

### データベース操作

| ツール | 説明 |
|--------|------|
| `list_tables` | 指定したスキーマ内のすべてのテーブルを一覧表示 |
| `list_extensions` | データベース内のすべての拡張機能を一覧表示 |
| `list_migrations` | データベース内のすべてのマイグレーションを一覧表示 |
| `apply_migration` | SQLマイグレーションをデータベースに適用（スキーマ変更用） |
| `execute_sql` | データベースで生のSQLを実行（通常のクエリ用） |
| `get_logs` | サービスタイプ別にSupabaseプロジェクトのログを取得 |

### プロジェクト設定

| ツール | 説明 |
|--------|------|
| `get_project_url` | プロジェクトのAPI URLを取得 |
| `get_anon_key` | プロジェクトの匿名APIキーを取得 |
| `generate_typescript_types` | データベーススキーマに基づいてTypeScriptの型を生成 |

### ブランチング機能（有料プラン必須）

| ツール | 説明 |
|--------|------|
| `create_branch` | 開発ブランチを作成 |
| `list_branches` | すべての開発ブランチを一覧表示 |
| `delete_branch` | 開発ブランチを削除 |
| `merge_branch` | 開発ブランチから本番ブランチにマイグレーションとエッジ関数をマージ |
| `reset_branch` | 開発ブランチのマイグレーションを以前のバージョンにリセット |
| `rebase_branch` | マイグレーションのドリフトを処理するために開発ブランチを本番ブランチ上にリベース |

## 使用例

### プロジェクト一覧の取得

AIアシスタントに以下のように指示します：

```
Supabaseのプロジェクト一覧を表示して
```

### SQLクエリの実行

```
以下のSQLをSupabaseで実行してください：
SELECT * FROM users LIMIT 10;
```

### テーブルの作成

```
Supabaseに新しいtasksテーブルを作成してください。フィールドはid、title（文字列）、completed（ブール値）、created_at（タイムスタンプ）が必要です。
```

### TypeScript型の生成

```
Supabaseプロジェクトの全テーブルに対するTypeScript型を生成してください
```

## 実際の使用フロー

1. Cursorエディタを開く
2. AIアシスタントとのチャットウィンドウを表示
3. Supabaseに関連する操作をAIアシスタントに指示
4. AIアシスタントがMCPサーバーを通じてSupabaseと通信
5. 結果がチャットウィンドウに表示される

## トラブルシューティング

### 接続エラーが発生する場合
- 個人アクセストークンが正しいか確認
- Node.jsが正しくインストールされているか確認
- インターネット接続が安定しているか確認

### コマンドが見つからないエラー
- Node.jsがPATHに正しく設定されているか確認
- Windowsの場合はコマンドプロンプトを管理者として実行

### パーミッションエラー
- アクセストークンの権限が十分か確認
- トークンが有効期限切れでないか確認

## 注意事項

- このサーバーはプレリリース版（pre-1.0）なので、バージョン間で破壊的変更がある可能性があります
- プロジェクト作成やSQLの実行など、重要な操作を行う際は慎重に指示を出してください
- 本番環境のデータベースを操作する場合は特に注意が必要です
- 初めて使用する際は、まず読み取り専用の操作（一覧表示やクエリの実行など）から始めるのが安全です

## 参考リンク

- [Supabase MCP GitHub](https://github.com/supabase-community/supabase-mcp)
- [Supabase 公式ドキュメント](https://supabase.com/docs)
- [Model Context Protocol について](https://supabase.com/mcp) 