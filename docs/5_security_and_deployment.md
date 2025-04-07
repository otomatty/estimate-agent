# セキュリティと展開

このドキュメントでは、見積もりシステムのセキュリティ対策と展開方法について解説します。

## セキュリティ対策

### 1. 認証と認可

#### Supabase認証の設定

Supabaseの認証機能を活用して安全なユーザー認証を実装します。

```typescript
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// サーバーサイドで使用する管理者権限のクライアント
export const getServerSupabase = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
};
```

#### Row Level Security (RLS) ポリシー

Supabaseのデータベースセキュリティを強化するために、RLSポリシーを設定します。

```sql
-- RLSを有効化
ALTER TABLE public.estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimate_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 見積もりテーブルのポリシー
CREATE POLICY "見積もりの閲覧は作成者のみ" ON public.estimates
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "見積もりの作成は認証ユーザーのみ" ON public.estimates
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "見積もりの更新は作成者のみ" ON public.estimates
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 質問テーブルのポリシー
CREATE POLICY "質問の閲覧は関連する見積もりの作成者のみ" ON public.estimate_questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.estimates
            WHERE id = estimate_questions.estimate_id
            AND user_id = auth.uid()
        )
    );

-- ユーザーテーブルのポリシー
CREATE POLICY "ユーザーは自分のプロフィールのみ閲覧可能" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "ユーザーは自分のプロフィールのみ更新可能" ON public.users
    FOR UPDATE
    USING (auth.uid() = id);
```

#### ミドルウェアによる認証確認

Next.jsのミドルウェアを使用して、認証が必要なルートへのアクセスを制御します。

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Supabaseミドルウェアクライアントの作成
  const supabase = createMiddlewareClient({ req, res });
  
  // セッションの確認
  const {
    data: { session },
  } = await supabase.auth.getSession();
  
  // 認証が必要なルートパターン
  const authRequiredPaths = [
    '/dashboard',
    '/estimates',
    '/profile',
  ];
  
  // パスが認証を必要とするかチェック
  const requiresAuth = authRequiredPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );
  
  // 認証が必要で未認証の場合、ログインページにリダイレクト
  if (requiresAuth && !session) {
    const redirectUrl = new URL('/login', req.url);
    redirectUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

// ミドルウェアを適用するパスを設定
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/estimates/:path*',
    '/profile/:path*',
    '/api/protected/:path*',
  ],
};
```

### 2. APIセキュリティ

#### レート制限の実装

APIルートへの過剰なリクエストを防止するためのレート制限を実装します。

```typescript
// src/lib/rateLimit.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

// 15分間に30リクエストまで許可
const RATE_LIMIT_MAX = 30;
const RATE_LIMIT_WINDOW = 60 * 15; // 15分

export async function rateLimit(req: NextRequest) {
  // クライアントIPを取得
  const ip = req.headers.get('x-forwarded-for') || req.ip || '127.0.0.1';
  
  // Redis用のキーを作成
  const key = `rate-limit:${ip}`;
  
  // 現在のカウントを取得または初期化
  let currentCount = await redis.get(key) as number || 0;
  
  // カウントが制限未満の場合
  if (currentCount < RATE_LIMIT_MAX) {
    // カウントを増やし、有効期限を設定
    await redis.incr(key);
    if (currentCount === 0) {
      await redis.expire(key, RATE_LIMIT_WINDOW);
    }
    return null;
  }
  
  // 制限を超えた場合
  return NextResponse.json(
    { error: 'Too Many Requests' },
    { status: 429, headers: { 'Retry-After': RATE_LIMIT_WINDOW.toString() } }
  );
}

// レート制限を適用するラッパー関数
export function withRateLimit(handler: Function) {
  return async (req: NextRequest) => {
    const rateLimitResult = await rateLimit(req);
    if (rateLimitResult) return rateLimitResult;
    return handler(req);
  };
}
```

APIルートにレート制限を適用する例:

```typescript
// src/app/api/estimates/generate/route.ts
import { withRateLimit } from '@/lib/rateLimit';
import { NextResponse } from 'next/server';

async function handler(req: Request) {
  // API実装
}

export const POST = withRateLimit(handler);
```

#### CSRFトークン保護

CSRFトークンを使用して、クロスサイトリクエストフォージェリ攻撃から保護します。

```typescript
// src/lib/csrf.ts
import crypto from 'crypto';
import { cookies } from 'next/headers';

export function generateCsrfToken() {
  const token = crypto.randomBytes(32).toString('hex');
  
  // HTTPOnly Cookieにトークンを保存
  cookies().set({
    name: 'csrf_token',
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
  });
  
  return token;
}

export function validateCsrfToken(token: string) {
  const storedToken = cookies().get('csrf_token')?.value;
  return storedToken === token;
}
```

フォームコンポーネントの例:

```tsx
// src/components/forms/InitialRequirementsForm.tsx（一部）
'use client';

import { useForm } from 'react-hook-form';

export default function InitialRequirementsForm({ onSubmit, isLoading, initialData, csrfToken }) {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: initialData || {
      clientName: '',
      projectName: '',
      requirements: '',
    }
  });
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* CSRFトークンを隠しフィールドとして含める */}
      <input type="hidden" {...register('csrfToken')} value={csrfToken} />
      
      {/* 他のフォームフィールド */}
    </form>
  );
}
```

### 3. データ保護

#### センシティブデータの暗号化

データベースに保存する前に機密データを暗号化します。

```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const IV_LENGTH = 16; // AES標準のIV長

export function encrypt(text: string): string {
  // 初期化ベクトルを生成
  const iv = crypto.randomBytes(IV_LENGTH);
  
  // 暗号化器を作成
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  // テキストを暗号化
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // IV + 暗号化テキストの形式で返す
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  // IV と暗号化テキストを分離
  const textParts = encryptedText.split(':');
  const iv = Buffer.from(textParts[0], 'hex');
  const encryptedData = textParts[1];
  
  // 復号器を作成
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv
  );
  
  // テキストを復号
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}
```

#### 個人情報のマスキング

ログやエラーレポートで個人情報が漏洩しないよう、マスキング処理を実装します。

```typescript
// src/lib/logging.ts
import pino from 'pino';

// マスキング対象のパターン
const MASKING_PATTERNS = {
  EMAIL: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  PHONE: /(\+\d{1,3}[\s\-]?)?\(?\d{2,4}\)?[\s\-]?\d{3,4}[\s\-]?\d{3,4}/g,
  CREDIT_CARD: /\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}/g,
};

// マスキング関数
function maskSensitiveData(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    if (typeof obj === 'string') {
      // 文字列中の機密情報をマスク
      let masked = obj;
      
      // メールアドレスのマスキング
      masked = masked.replace(MASKING_PATTERNS.EMAIL, '[EMAIL]');
      
      // 電話番号のマスキング
      masked = masked.replace(MASKING_PATTERNS.PHONE, '[PHONE]');
      
      // クレジットカード番号のマスキング
      masked = masked.replace(MASKING_PATTERNS.CREDIT_CARD, '[CREDIT_CARD]');
      
      return masked;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => maskSensitiveData(item));
  }
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    // キーに基づくマスキング
    if (['email', 'phone', 'creditCard', 'password'].includes(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = maskSensitiveData(value);
    }
  }
  
  return result;
}

// マスキング機能付きのロガーを作成
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
  serializers: {
    req: (req) => {
      return maskSensitiveData({
        method: req.method,
        url: req.url,
        headers: req.headers,
        query: req.query,
        body: req.body,
      });
    },
    res: (res) => {
      return maskSensitiveData({
        statusCode: res.statusCode,
        headers: res.headers,
      });
    },
    err: (err) => {
      return maskSensitiveData({
        type: err.type,
        message: err.message,
        stack: err.stack,
      });
    },
  },
});
```

## 展開方法

### 1. インフラストラクチャ設定

#### Vercel へのデプロイ

Next.jsアプリケーションをVercelにデプロイするための設定:

```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "headers": {
        "Cache-Control": "no-cache, no-store, must-revalidate"
      }
    }
  ],
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "GEMINI_API_KEY": "@gemini_api_key",
    "ENCRYPTION_KEY": "@encryption_key"
  }
}
```

#### GitHub Actionsワークフロー

CI/CDパイプラインの設定:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run tests
        run: npm test
        
  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to Vercel
        uses: vercel/action@v3
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### 2. 環境変数管理

#### .env ファイルの構成

開発環境用と本番環境用の環境変数を適切に管理します。

```bash
# .env.development
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJI...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJI...
GEMINI_API_KEY=your_gemini_api_key
ENCRYPTION_KEY=local_encryption_key_for_development
```

```bash
# .env.production
# 本番環境では実際の値は Vercel や他のCI/CDツールで設定
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
ENCRYPTION_KEY=
```

#### 環境変数の型定義

TypeScriptで環境変数の型を定義して、使用時の型チェックを強化します。

```typescript
// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY?: string;
    GEMINI_API_KEY: string;
    ENCRYPTION_KEY?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}
```

### 3. スケーリング対策

#### Mastraワーカーのスケーリング

Mastraエージェントを処理するワーカープロセスのスケーリング設定:

```typescript
// src/mastra/config.ts
export const mastraConfig = {
  workers: {
    // 環境に応じてワーカー数を設定
    count: process.env.NODE_ENV === 'production' ? 4 : 1,
    // メモリ使用量の監視と自動再起動設定
    maxMemoryMB: 2048,
    // キューの設定
    queue: {
      maxConcurrent: 10,
      stallInterval: 30000, // 30秒
      retryLimit: 3,
    },
  },
  // タイムアウト設定
  timeouts: {
    workflow: 300000, // 5分
    agent: 180000, // 3分
    tool: 60000, // 1分
  },
};
```

#### ワークフローキューの実装

長時間実行されるワークフローをキューに入れて処理するための実装:

```typescript
// src/lib/workflowQueue.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { mastra } from '@/mastra';
import { logger } from '@/lib/logging';

// Redis接続の設定
const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// ワークフローキューの作成
export const workflowQueue = new Queue('estimate-workflows', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// ワーカーの設定と起動
if (process.env.NODE_ENV === 'production') {
  const worker = new Worker('estimate-workflows', async (job) => {
    const { workflowId, input } = job.data;
    
    logger.info(`ワークフロー開始: ${workflowId}`, { jobId: job.id });
    
    try {
      // ワークフローの取得と実行
      const workflow = mastra.getWorkflow(workflowId);
      const result = await workflow.run(input);
      
      logger.info(`ワークフロー完了: ${workflowId}`, { jobId: job.id });
      
      return result;
    } catch (error) {
      logger.error(`ワークフローエラー: ${workflowId}`, { 
        jobId: job.id,
        error: error.message,
        stack: error.stack,
      });
      
      throw error;
    }
  }, { connection: redisConnection });
  
  worker.on('failed', (job, error) => {
    logger.error('ワークフロー失敗', {
      jobId: job?.id,
      error: error.message,
    });
  });
}

// キューにワークフローを追加する関数
export async function queueWorkflow(workflowId: string, input: any) {
  const job = await workflowQueue.add(
    `workflow-${workflowId}`,
    { workflowId, input },
    { 
      // ジョブID生成
      jobId: `${workflowId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    }
  );
  
  return job.id;
}

// ジョブの状態を確認する関数
export async function getJobStatus(jobId: string) {
  const job = await workflowQueue.getJob(jobId);
  if (!job) return { status: 'not_found' };
  
  return {
    id: job.id,
    status: await job.getState(),
    progress: job.progress,
    data: job.returnvalue,
    error: job.failedReason,
    timestamp: job.timestamp,
  };
}
```

### 4. モニタリングと監視

#### Sentryによるエラー監視

Sentryを使用してエラー監視を設定します:

```typescript
// src/lib/sentry.ts
import * as Sentry from '@sentry/nextjs';

// 本番環境のみSentryを有効化
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.5, // パフォーマンスの50%をキャプチャ
    environment: process.env.VERCEL_ENV || 'production',
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
    ],
  });
}

// カスタムコンテキストを追加するヘルパー関数
export function setSentryUser(user: { id: string; email?: string }) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.setUser({
      id: user.id,
      // メールアドレスは部分的にマスク
      email: user.email ? maskEmail(user.email) : undefined,
    });
  }
}

function maskEmail(email: string): string {
  const [name, domain] = email.split('@');
  if (!name || !domain) return '[INVALID_EMAIL]';
  
  return `${name.charAt(0)}${'*'.repeat(name.length - 2)}${name.charAt(name.length - 1)}@${domain}`;
}

// エラーのラッピングとカスタムコンテキスト追加
export function captureError(error: any, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context,
    });
  }
  
  // 開発環境では通常のログ出力
  console.error('[ERROR]', error, context || {});
}
```

#### カスタムヘルスチェックAPI

システムの健全性を監視するためのヘルスチェックAPIを実装します:

```typescript
// src/app/api/health/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { mastra } from '@/mastra';
import { workflowQueue } from '@/lib/workflowQueue';

export async function GET() {
  const checks = {
    api: { status: 'ok' },
    database: { status: 'pending' },
    mastra: { status: 'pending' },
    queue: { status: 'pending' },
  };
  
  let allOk = true;
  
  // データベース接続チェック
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data, error } = await supabase.from('health_check').select('created_at').limit(1);
    
    if (error) {
      checks.database = { status: 'error', error: error.message };
      allOk = false;
    } else {
      checks.database = { status: 'ok' };
    }
  } catch (error) {
    checks.database = { status: 'error', error: error.message };
    allOk = false;
  }
  
  // Mastraエージェント接続チェック
  try {
    const agents = mastra.getAgents();
    checks.mastra = { 
      status: 'ok', 
      agents: Object.keys(agents).length 
    };
  } catch (error) {
    checks.mastra = { status: 'error', error: error.message };
    allOk = false;
  }
  
  // ワークフローキューチェック
  try {
    const queueStatus = await workflowQueue.getJobCounts();
    checks.queue = { 
      status: 'ok', 
      counts: queueStatus 
    };
  } catch (error) {
    checks.queue = { status: 'error', error: error.message };
    allOk = false;
  }
  
  return NextResponse.json({
    status: allOk ? 'ok' : 'error',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    checks,
  }, { status: allOk ? 200 : 500 });
}
```

## バックアップと復元

### 1. Supabaseデータのバックアップ

定期的なデータバックアップを自動化します:

```typescript
// scripts/backup.ts
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function backupDatabase() {
  const backupDir = path.join(process.cwd(), 'backups');
  
  // バックアップディレクトリの作成
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  // バックアップファイル名
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `backup-${timestamp}.json`);
  
  // Supabaseクライアントの初期化
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  // バックアップデータの格納用オブジェクト
  const backupData: Record<string, any> = {};
  
  // テーブルリストの取得
  const tablesResponse = await fetch(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/?apikey=${process.env.SUPABASE_SERVICE_ROLE_KEY}`
  );
  const tables = await tablesResponse.json();
  
  // 各テーブルのデータをエクスポート
  for (const tableName of tables) {
    const { data, error } = await supabase.from(tableName).select('*');
    
    if (error) {
      console.error(`テーブル ${tableName} のバックアップエラー:`, error);
      continue;
    }
    
    backupData[tableName] = data;
    console.log(`テーブル ${tableName}: ${data.length} 行バックアップ完了`);
  }
  
  // バックアップデータをファイルに書き込み
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
  
  // バックアップの圧縮
  execSync(`gzip ${backupFile}`);
  
  console.log(`バックアップ完了: ${backupFile}.gz`);
  
  // 古いバックアップの削除（30日以上前のもの）
  const files = fs.readdirSync(backupDir);
  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  
  for (const file of files) {
    const filePath = path.join(backupDir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.birthtime.getTime() < thirtyDaysAgo) {
      fs.unlinkSync(filePath);
      console.log(`古いバックアップを削除: ${file}`);
    }
  }
}

backupDatabase().catch(console.error);
```

### 2. ディザスタリカバリ計画

災害時の復旧手順をドキュメント化します:

```markdown
# ディザスタリカバリ計画

## 障害シナリオと対応手順

### 1. データベース障害

#### 症状
- データベース接続エラー
- クエリタイムアウト
- 高いレイテンシ

#### 対応手順
1. ヘルスチェックAPIでデータベースステータスを確認
2. Supabaseダッシュボードで障害を検証
3. Supabaseサポートに連絡（必要な場合）
4. 復旧待機中はアプリケーションをメンテナンスモードに切り替え
5. 障害解消後、データの整合性を検証

### 2. API障害

#### 症状
- AIエージェントの応答なし
- ワークフローのタイムアウト
- 高いエラー率

#### 対応手順
1. ログでエラーパターンを確認
2. Sentryでエラーの詳細を分析
3. レート制限など、APIプロバイダの問題を確認
4. 必要に応じてフォールバック設定を有効化
5. 障害が解消されたら正常な動作を検証

### 3. 全システム障害

#### 症状
- アプリケーション全体が利用不可
- 複数のコンポーネントで障害

#### 対応手順
1. インフラストラクチャプロバイダ（Vercel, Supabase等）のステータスを確認
2. 担当者に緊急連絡
3. 影響範囲を特定し、ユーザーに通知
4. 復旧作業を優先順位付け
5. 最新のバックアップから復元（必要な場合）

## バックアップ復元手順

1. 最新のバックアップファイルを特定
2. 復元スクリプトを実行:
   ```bash
   NODE_ENV=production SUPABASE_URL=xxx SUPABASE_KEY=yyy ts-node scripts/restore.ts --file=backups/backup-2023-04-01.json.gz
   ```
3. データ整合性を検証
4. アプリケーションのヘルスチェックを実行
5. 段階的にサービスを再開

## 連絡体制

- システム管理者: admin@example.com, 090-XXXX-XXXX
- Supabaseサポート: https://supabase.com/support
- Vercelサポート: https://vercel.com/help
- その他の緊急連絡先...
```

## まとめ

このドキュメントでは、見積もりシステムのセキュリティ対策と展開方法について詳細に解説しました。主なポイントは以下の通りです：

1. **セキュリティ対策**
   - Supabase認証とRLSポリシーによるデータ保護
   - APIセキュリティ（レート制限、CSRFトークン）
   - データ暗号化と個人情報マスキング

2. **展開方法**
   - Vercelへのデプロイとインフラ設定
   - CI/CDパイプラインの構築
   - 環境変数の適切な管理

3. **スケーリング**
   - Mastraワーカーのスケーリング設定
   - ワークフローキューを使用した長時間処理の最適化

4. **監視とバックアップ**
   - Sentryによるエラー監視
   - ヘルスチェックによる状態監視
   - 定期バックアップとディザスタリカバリ計画

これらの対策を適切に実装することで、見積もりシステムのセキュリティ、信頼性、可用性を確保し、ユーザーに安全なサービスを提供することができます。 