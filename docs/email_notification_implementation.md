# メール通知実装計画

このドキュメントでは、見積もり完了後のメールアドレス収集からメール通知、そしてユーザー登録への誘導まで、一連のフローの実装方法について説明します。

## 1. 概要

匿名ユーザーが見積もりプロセスを完了した後、以下の流れでメール通知を行います：

1. 見積もり結果画面でメールアドレスを収集
2. 収集したメールアドレスと一時見積もりデータを紐付け
3. 見積書PDFと詳細な分析資料をメールで送信
4. ユーザー登録へ誘導するリンクをメールに含める

## 2. メールアドレス収集UI

見積もり結果画面の下部にメールアドレス収集フォームを配置します。

```tsx
// components/EmailCollectionForm.tsx
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface EmailCollectionFormProps {
  temporaryEstimateId: string;
  onSuccess: () => void;
}

export const EmailCollectionForm: React.FC<EmailCollectionFormProps> = ({ 
  temporaryEstimateId, 
  onSuccess 
}) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!email || !email.includes('@')) {
      setError('有効なメールアドレスを入力してください');
      setIsSubmitting(false);
      return;
    }

    try {
      // 1. 一時見積もりデータにメールアドレスを保存
      const { error: updateError } = await supabase
        .from('temporary_estimates')
        .update({ email })
        .eq('id', temporaryEstimateId);

      if (updateError) throw new Error(updateError.message);

      // 2. メール通知エントリの作成
      const { error: notificationError } = await supabase
        .from('email_notifications')
        .insert({
          email,
          temporary_estimate_id: temporaryEstimateId,
          status: 'pending',
          content: { 
            type: 'estimate_completed',
            subject: '【業務システム見積もり】お見積り結果のご案内' 
          }
        });

      if (notificationError) throw new Error(notificationError.message);

      // 3. メール送信をトリガーするEdge Functionを呼び出す
      const { error: functionError } = await supabase.functions.invoke('send-estimate-email', {
        body: { temporaryEstimateId, email }
      });

      if (functionError) throw new Error(functionError.message);

      setIsSuccess(true);
      onSuccess();
    } catch (err) {
      console.error('メール送信設定エラー:', err);
      setError('メール設定に失敗しました。もう一度お試しください。');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 bg-green-50 rounded-lg border border-green-200 my-4">
        <h3 className="text-green-800 font-medium">メール送信準備完了</h3>
        <p className="text-green-700 mt-1">
          {email} 宛に見積もり結果を送信しました。ご確認ください。
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 bg-gray-50 my-6">
      <h3 className="text-lg font-medium mb-3">見積書と詳細な分析資料をメールで受け取る</h3>
      
      <p className="text-gray-600 mb-4">
        見積書PDFと詳細な分析資料をメールでお送りします。
        後で見積もりを編集したい場合は、アカウント登録のリンクもメールに記載されています。
      </p>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-grow px-4 py-2 border rounded-md"
          disabled={isSubmitting}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          disabled={isSubmitting}
        >
          {isSubmitting ? '送信中...' : 'メールで受け取る'}
        </button>
      </form>
      
      <div className="mt-3 text-xs text-gray-500">
        ※ご入力いただいたメールアドレスは見積もり情報の送信のみに使用し、
        それ以外の目的で使用することはありません。
      </div>
    </div>
  );
};
```

結果表示コンポーネントにこのフォームを組み込みます：

```tsx
// components/EstimateResult.tsx の一部（メールフォーム追加部分）

// EstimateResult コンポーネント内
const [shouldShowEmailForm, setShouldShowEmailForm] = useState(true);

// 後略...

// 詳細分析タブの内容（後半部分）
{activeTab === 'detailed-analysis' && (
  <div>
    {/* 詳細分析の内容... */}
    
    {/* メールフォーム */}
    {shouldShowEmailForm && (
      <EmailCollectionForm
        temporaryEstimateId={temporaryEstimateId}
        onSuccess={() => setShouldShowEmailForm(false)}
      />
    )}
  </div>
)}
```

## 3. Edge Function: メール送信処理

Supabase Edge Functionsを使用して、見積もり結果を含むメールを送信する処理を実装します。

```typescript
// supabase/functions/send-estimate-email/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';
import * as SendGrid from 'https://esm.sh/@sendgrid/mail@7.7.0';

interface RequestBody {
  temporaryEstimateId: string;
  email: string;
}

serve(async (req) => {
  try {
    // リクエストBODYの取得
    const { temporaryEstimateId, email } = await req.json() as RequestBody;

    // 環境変数の取得
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY') as string;
    const fromEmail = Deno.env.get('FROM_EMAIL') as string;

    if (!supabaseUrl || !supabaseServiceRoleKey || !sendGridApiKey || !fromEmail) {
      throw new Error('必要な環境変数が設定されていません');
    }

    // SendGridの設定
    SendGrid.setApiKey(sendGridApiKey);

    // Supabaseクライアントの初期化（サービスロールキーを使用）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 一時見積もりデータの取得
    const { data: tempEstimate, error: tempEstimateError } = await supabase
      .from('temporary_estimates')
      .select(`
        id, title, total_amount, pdf_url,
        temporary_estimate_items (id, name, description, unit_price, quantity, is_selected)
      `)
      .eq('id', temporaryEstimateId)
      .eq('email', email)
      .single();

    if (tempEstimateError || !tempEstimate) {
      throw new Error('見積もりデータの取得に失敗しました');
    }

    // ビジネス分析データの取得
    const { data: businessAnalysis, error: businessAnalysisError } = await supabase
      .from('business_analyses')
      .select('*')
      .eq('temporary_estimate_id', temporaryEstimateId)
      .single();

    // アカウント登録用トークンの生成（7日間有効）
    const signupToken = await generateSignupToken(email, temporaryEstimateId);

    // 見積もり情報からHTMLメールを作成
    const mailHtml = generateEstimateEmailHtml({
      estimate: tempEstimate,
      businessAnalysis,
      signupToken,
      baseUrl: Deno.env.get('PUBLIC_BASE_URL') || 'https://yourdomain.com'
    });

    // メール送信
    const msg = {
      to: email,
      from: {
        email: fromEmail,
        name: 'システム見積もりサービス'
      },
      subject: '【業務システム見積もり】お見積り結果のご案内',
      html: mailHtml,
      attachments: []
    };

    // PDFが存在する場合、添付ファイルとして追加
    if (tempEstimate.pdf_url) {
      // PDFのダウンロード
      const pdfResponse = await fetch(tempEstimate.pdf_url);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

      msg.attachments.push({
        content: base64Pdf,
        filename: `見積書_${tempEstimate.title || '無題'}.pdf`,
        type: 'application/pdf',
        disposition: 'attachment'
      });
    }

    // メール送信実行
    await SendGrid.send(msg);

    // メール送信ステータスの更新
    await supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString()
      })
      .eq('temporary_estimate_id', temporaryEstimateId)
      .eq('email', email);

    return new Response(
      JSON.stringify({ success: true, message: 'メールを送信しました' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('メール送信エラー:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

// アカウント登録用のトークンを生成
async function generateSignupToken(email: string, estimateId: string): Promise<string> {
  // 実際の実装では、JWTトークンなどを生成し、有効期限などを設定する
  // このサンプルでは簡易的な実装
  const payload = {
    email,
    estimateId,
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7日間有効
  };
  
  // Base64でエンコード（実際にはもっと安全な方法を使用すべき）
  return btoa(JSON.stringify(payload));
}

// メールのHTML本文を生成
function generateEstimateEmailHtml(options: {
  estimate: any;
  businessAnalysis: any;
  signupToken: string;
  baseUrl: string;
}): string {
  const { estimate, businessAnalysis, signupToken, baseUrl } = options;
  
  // 選択された機能のみフィルタリング
  const selectedItems = estimate.temporary_estimate_items.filter(item => item.is_selected);
  
  // 桁区切りの金額表示に変換（日本円想定）
  const formattedAmount = new Intl.NumberFormat('ja-JP').format(estimate.total_amount || 0);
  
  // ユーザー登録ページへのリンク
  const signupUrl = `${baseUrl}/signup?token=${encodeURIComponent(signupToken)}`;
  
  // 見積もり詳細ページへのリンク
  const estimateUrl = `${baseUrl}/estimates/temporary/${estimate.id}`;
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>見積もり結果のご案内</title>
    <style>
      body { font-family: sans-serif; line-height: 1.6; color: #333; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; }
      .button { display: inline-block; padding: 10px 20px; background-color: #4a6cf7; color: white; 
                text-decoration: none; border-radius: 5px; margin-top: 15px; }
      .footer { margin-top: 30px; font-size: 12px; color: #666; border-top: 1px solid #eee; padding-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin: 20px 0; }
      th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
      th { background-color: #f5f5f5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>見積もり結果のご案内</h1>
        <p>お客様の業務システム開発の見積もり結果をお送りします。</p>
      </div>
      
      <h2>見積もり概要</h2>
      <p><strong>見積もり名:</strong> ${estimate.title || '無題の見積もり'}</p>
      <p><strong>合計金額:</strong> ${formattedAmount}円 (税抜)</p>
      
      <h3>選択された機能一覧</h3>
      <table>
        <tr>
          <th>機能名</th>
          <th>単価</th>
          <th>数量</th>
          <th>小計</th>
        </tr>
        ${selectedItems.map(item => `
          <tr>
            <td>${item.name}</td>
            <td>${new Intl.NumberFormat('ja-JP').format(item.unit_price || 0)}円</td>
            <td>${item.quantity}</td>
            <td>${new Intl.NumberFormat('ja-JP').format((item.unit_price || 0) * (item.quantity || 1))}円</td>
          </tr>
        `).join('')}
      </table>
      
      ${businessAnalysis ? `
        <h2>ビジネス効果分析</h2>
        <p>このシステム開発による推定ビジネス効果は以下の通りです：</p>
        <ul>
          ${businessAnalysis.roi_analysis ? `
            <li><strong>投資回収期間:</strong> 約${businessAnalysis.roi_analysis.payback_period || '--'}ヶ月</li>
            <li><strong>3年間ROI:</strong> ${businessAnalysis.roi_analysis.three_year_roi || '--'}%</li>
          ` : ''}
          ${businessAnalysis.efficiency_prediction ? `
            <li><strong>業務効率化率:</strong> 約${businessAnalysis.efficiency_prediction.efficiency_rate || '--'}%</li>
            <li><strong>年間工数削減:</strong> 約${businessAnalysis.efficiency_prediction.time_saved || '--'}時間</li>
          ` : ''}
        </ul>
      ` : ''}
      
      <h2>今後のステップ</h2>
      <p>
        より詳細な情報や見積もり内容の編集をご希望の場合は、アカウントを作成して見積もりを管理できます。
        以下のボタンからアカウントを作成すると、今回の見積もりデータが自動的に連携されます。
      </p>
      
      <a href="${signupUrl}" class="button">アカウントを作成する</a>
      
      <p>
        または、アカウント作成なしで再度この見積もりを確認する場合は、以下のリンクをクリックしてください：
      </p>
      
      <a href="${estimateUrl}">見積もり詳細を確認する</a>
      
      <div class="footer">
        <p>
          ※このメールは自動送信されています。ご質問やご不明点がございましたら、返信にてお問い合わせください。<br>
          ※添付のPDFファイルには見積もりの詳細情報が含まれています。
        </p>
      </div>
    </div>
  </body>
  </html>
  `;
}
```

## 4. ユーザー登録フロー

メールのリンクからユーザーがアカウント登録を行う際の処理を実装します。

```tsx
// pages/signup.tsx
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function SignupPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [tokenData, setTokenData] = useState<{
    email: string;
    estimateId: string;
  } | null>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    company: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // トークンのデコード
  useEffect(() => {
    if (token && typeof token === 'string') {
      try {
        // Base64デコード（実際にはもっと安全な検証が必要）
        const decoded = JSON.parse(atob(token));
        
        if (decoded.email && decoded.estimateId) {
          setTokenData(decoded);
          setFormData(prev => ({ ...prev, email: decoded.email }));
        } else {
          setError('無効なトークンです');
        }
      } catch (err) {
        console.error('トークン解析エラー:', err);
        setError('無効なトークンです');
      }
    }
  }, [token]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません');
      setIsLoading(false);
      return;
    }
    
    if (formData.password.length < 8) {
      setError('パスワードは8文字以上で設定してください');
      setIsLoading(false);
      return;
    }
    
    try {
      // 1. ユーザー登録
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            company: formData.company
          }
        }
      });
      
      if (authError) throw authError;
      
      // 2. 一時データを正式なデータに移行
      if (tokenData?.estimateId) {
        // Edge Functionを利用して一時データの移行処理を実行
        const { error: migrationError } = await supabase.functions.invoke('migrate-estimate-data', {
          body: { 
            temporaryEstimateId: tokenData.estimateId,
            userId: authData.user?.id
          }
        });
        
        if (migrationError) {
          console.error('データ移行エラー:', migrationError);
          // エラーがあっても、登録自体は完了させる
        }
      }
      
      // ユーザーにメールの確認を促す
      router.push('/signup/confirmation');
      
    } catch (err) {
      console.error('登録エラー:', err);
      setError('アカウント登録に失敗しました: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">アカウント登録</h1>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">メールアドレス</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
            readOnly={!!tokenData} // トークンから取得した場合は編集不可
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">パスワード</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">パスワード（確認）</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
            required
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">お名前</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">会社名</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-md"
          />
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300"
          disabled={isLoading}
        >
          {isLoading ? '処理中...' : 'アカウントを作成する'}
        </button>
      </form>
      
      <p className="mt-4 text-sm text-gray-600">
        既にアカウントをお持ちの方は <a href="/login" className="text-blue-600 hover:underline">こちらからログイン</a>
      </p>
    </div>
  );
}
```

## 5. データ移行処理 Edge Function

ユーザー登録時に一時データを正式なデータに移行するEdge Functionを実装します。

```typescript
// supabase/functions/migrate-estimate-data/index.ts
import { serve } from 'https://deno.land/std@0.131.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0';

interface RequestBody {
  temporaryEstimateId: string;
  userId: string;
}

serve(async (req) => {
  try {
    // リクエストBODYの取得
    const { temporaryEstimateId, userId } = await req.json() as RequestBody;
    
    if (!temporaryEstimateId || !userId) {
      throw new Error('必要なパラメータが不足しています');
    }

    // 環境変数の取得
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('必要な環境変数が設定されていません');
    }

    // Supabaseクライアントの初期化（サービスロールキーを使用）
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // PostgreSQL関数を呼び出してデータ移行を実行
    const { data, error } = await supabase.rpc(
      'migrate_temporary_estimate_to_permanent',
      {
        p_temp_estimate_id: temporaryEstimateId,
        p_user_id: userId
      }
    );

    if (error) throw error;

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'データを正常に移行しました',
        estimateId: data
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('データ移行エラー:', error);
    
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

## 6. セキュリティ上の考慮事項

1. **トークンのセキュリティ**
   - 単純なBase64エンコードではなく、署名付きJWTトークンを使用する
   - 適切な有効期限の設定（例: 7日間）
   - トークンの再利用防止策の実装

2. **メール送信のセキュリティ**
   - SPF、DKIM、DMARCなどのメール認証を設定
   - センシティブ情報はメール本文に含めない
   - Supabaseのサービスロールキーを適切に管理

3. **データ移行時のセキュリティ**
   - トークンとユーザーIDの関連を検証
   - RLSポリシーの徹底的なテスト

## 7. 実装上の注意点

1. **エラーハンドリング**
   - すべての非同期処理で適切なエラーハンドリングを行う
   - ユーザーにわかりやすいエラーメッセージを表示

2. **パフォーマンス**
   - メール送信は非同期で処理し、ユーザー体験を阻害しない
   - PDFの生成と送信を最適化

3. **ユーザー体験**
   - メール送信後、次のステップを明確に示す
   - 複数回のメール送信リクエストに対する制限の実装
   - アカウント登録の利点を明確にアピール

4. **テスト**
   - メール送信フローの徹底的なテスト
   - 異なるメールクライアントでのHTMLメールの表示確認
   - データ移行プロセスのテスト

## 8. デプロイチェックリスト

- [ ] SendGrid APIキーの設定
- [ ] 送信元メールアドレスのドメイン検証
- [ ] SPF/DKIM/DMARC設定の確認
- [ ] Supabase Edge Functionsのデプロイ
- [ ] 各環境変数の設定
- [ ] メールテンプレートのテスト

## まとめ

この実装により、匿名ユーザーが見積もりを完了した後、メールアドレスを提供するだけで詳細な見積もり情報を受け取ることができます。また、メール内のリンクからスムーズにアカウント登録を行い、一時データを正式なアカウントに紐付けることができます。

ユーザーがメールアドレスを入力するタイミングを見積もりプロセスの最後に設定することで、ユーザーに対する心理的抵抗を減らし、コンバージョン率を高める効果が期待できます。 