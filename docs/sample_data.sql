-- サンプルデータ: 業務システム自動見積もりAIエージェント
-- 作成日: YYYY-MM-DD

-- 注意: このファイルはSupabaseのSQLエディタでそのまま実行できます。
-- 順序に注意して実行してください（system_categories → question_templates → project_templates）

-- =====================
-- system_categories: システムカテゴリ
-- =====================
INSERT INTO public.system_categories (id, name, description, keywords, default_questions)
VALUES
    (
        gen_random_uuid(), 
        '顧客管理システム (CRM)', 
        '顧客情報、商談、問い合わせなどを管理するシステム',
        '["顧客", "CRM", "顧客管理", "商談", "問い合わせ", "売上管理", "商談管理", "コンタクト", "連絡先"]',
        '[
            "既存システムの有無と移行データの規模",
            "管理する顧客数の規模（概算）",
            "必要なユーザー権限レベル数",
            "顧客データの項目数と複雑さ",
            "商談/案件管理の有無",
            "売上情報連携の有無",
            "外部システム連携の有無",
            "モバイル対応の必要性",
            "レポート・分析機能の要件"
        ]'::jsonb
    ),
    (
        gen_random_uuid(), 
        '在庫管理システム', 
        '商品、在庫、発注、入出庫を管理するシステム',
        '["在庫", "倉庫", "SKU", "バーコード", "入出庫", "棚卸", "発注", "仕入れ", "商品管理"]',
        '[
            "管理する商品数（SKU数）",
            "倉庫・保管場所の数",
            "バーコード管理の必要性",
            "発注管理機能の有無",
            "仕入先管理の有無",
            "複数倉庫対応の必要性",
            "在庫アラート機能の要件",
            "棚卸機能の必要性",
            "モバイル/ハンディ端末対応の有無"
        ]'::jsonb
    ),
    (
        gen_random_uuid(), 
        '予約・スケジュール管理システム', 
        '予約、スケジュール、リソース管理を行うシステム',
        '["予約", "スケジュール", "カレンダー", "空き状況", "リソース", "アポイント", "イベント", "シフト"]',
        '[
            "予約対象（人・設備・部屋など）の数と種類",
            "同時管理するカレンダー数",
            "予約の単位時間（15分刻み、1時間刻みなど）",
            "予約確認フローの有無",
            "顧客による自己予約機能の必要性",
            "定期予約機能の必要性",
            "通知機能の要件",
            "決済連携の有無",
            "モバイル対応の必要性"
        ]'::jsonb
    ),
    (
        gen_random_uuid(), 
        '業務ワークフローシステム', 
        '申請、承認、タスク管理などの業務フローを管理するシステム',
        '["ワークフロー", "承認", "申請", "決裁", "稟議", "タスク管理", "業務フロー", "BPM"]',
        '[
            "管理するワークフロー種類の数",
            "承認階層の最大数",
            "ユーザー権限レベルの数",
            "承認条件の複雑さ",
            "申請フォームのカスタマイズ要件",
            "通知機能の要件",
            "期限管理機能の必要性",
            "履歴管理の要件",
            "分析・レポート機能の要件"
        ]'::jsonb
    ),
    (
        gen_random_uuid(), 
        'プロジェクト管理システム', 
        'プロジェクト、タスク、リソースなどを管理するシステム',
        '["プロジェクト", "タスク", "ガントチャート", "進捗", "WBS", "マイルストーン", "プロマネ", "PM"]',
        '[
            "同時管理するプロジェクト数",
            "平均的なタスク数/プロジェクト",
            "ガントチャート機能の必要性",
            "リソース管理の要件",
            "コスト管理機能の必要性",
            "マイルストーン管理の要件",
            "ファイル共有機能の必要性",
            "外部システム連携の有無",
            "モバイル対応の必要性"
        ]'::jsonb
    );

-- =====================
-- question_templates: 質問テンプレート
-- =====================
INSERT INTO public.question_templates (id, category, question, description, position, is_required, conditions)
VALUES
    -- 共通質問 (カテゴリ: 'common')
    (
        gen_random_uuid(),
        'common',
        'このシステムを利用するユーザー数はどのくらいを想定していますか？',
        'システム規模とライセンス数の算出に必要です',
        10,
        true,
        NULL
    ),
    (
        gen_random_uuid(),
        'common',
        'システムへのアクセス方法について、どのような要件がありますか？（ブラウザ、専用アプリ、スマートフォン対応など）',
        '開発プラットフォームと対応範囲を決定するための質問です',
        20,
        true,
        NULL
    ),
    (
        gen_random_uuid(),
        'common',
        '既存システムからのデータ移行は必要ですか？必要な場合、どのようなデータをどの程度の量、移行する予定ですか？',
        'データ移行の複雑さと工数を見積もるための質問です',
        30,
        true,
        NULL
    ),
    (
        gen_random_uuid(),
        'common',
        '導入予定時期はいつ頃を想定していますか？',
        '開発スケジュールの制約条件を確認するための質問です',
        40,
        true,
        NULL
    ),
    (
        gen_random_uuid(),
        'common',
        '他システムとの連携は必要ですか？必要な場合、どのようなシステムとどのようなデータを連携する予定ですか？',
        'API開発や連携機能の工数を見積もるための質問です',
        50,
        true,
        NULL
    ),
    
    -- 顧客管理システム (CRM) 向け質問
    (
        gen_random_uuid(),
        'crm',
        '顧客データとして管理したい項目は何ですか？（例：基本情報、取引履歴、対応履歴、ファイル添付など）',
        'データモデルの複雑さと規模を把握するための質問です',
        60,
        true,
        '{"categoryMatches": ["顧客管理", "CRM"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'crm',
        '商談/案件管理機能は必要ですか？必要な場合、どのような情報を管理したいですか？',
        '商談管理機能の要件を確認する質問です',
        70,
        true,
        '{"categoryMatches": ["顧客管理", "CRM"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'crm',
        '顧客とのコミュニケーション履歴（メール、電話など）の管理は必要ですか？',
        'コミュニケーション履歴管理機能の要件を確認する質問です',
        80,
        false,
        '{"categoryMatches": ["顧客管理", "CRM"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'crm',
        '売上情報や請求書情報の管理は必要ですか？',
        '財務関連機能の要件を確認する質問です',
        90,
        false,
        '{"categoryMatches": ["顧客管理", "CRM"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'crm',
        'マーケティングキャンペーン管理機能は必要ですか？',
        'マーケティング機能の要件を確認する質問です',
        100,
        false,
        '{"categoryMatches": ["顧客管理", "CRM"]}'::jsonb
    ),
    
    -- 在庫管理システム向け質問
    (
        gen_random_uuid(),
        'inventory',
        '何種類の商品（SKU）を管理する予定ですか？',
        'データボリュームとパフォーマンス要件を確認する質問です',
        60,
        true,
        '{"categoryMatches": ["在庫", "倉庫", "商品管理"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'inventory',
        '複数の倉庫や保管場所の管理は必要ですか？必要な場合、何ヶ所程度を想定していますか？',
        'ロケーション管理機能の要件を確認する質問です',
        70,
        true,
        '{"categoryMatches": ["在庫", "倉庫", "商品管理"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'inventory',
        'バーコードやQRコードを使用した在庫管理は必要ですか？',
        'スキャンおよびコード管理機能の要件を確認する質問です',
        80,
        false,
        '{"categoryMatches": ["在庫", "倉庫", "商品管理"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'inventory',
        '発注管理機能は必要ですか？必要な場合、発注ワークフローについても説明してください。',
        '発注管理機能の要件を確認する質問です',
        90,
        false,
        '{"categoryMatches": ["在庫", "倉庫", "商品管理"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'inventory',
        '在庫アラート機能（在庫が少なくなった際の通知など）は必要ですか？',
        'アラート機能の要件を確認する質問です',
        100,
        false,
        '{"categoryMatches": ["在庫", "倉庫", "商品管理"]}'::jsonb
    ),
    
    -- 予約システム向け質問
    (
        gen_random_uuid(),
        'booking',
        '何を予約対象としますか？（例：部屋、設備、人員、サービスなど）',
        '予約対象の種類と特性を把握するための質問です',
        60,
        true,
        '{"categoryMatches": ["予約", "スケジュール", "カレンダー"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'booking',
        '予約の最小単位時間はいくらですか？（例：15分刻み、30分刻み、1時間刻みなど）',
        '予約スケジューリングの粒度を確認する質問です',
        70,
        true,
        '{"categoryMatches": ["予約", "スケジュール", "カレンダー"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'booking',
        'お客様自身が予約できるセルフサービス機能は必要ですか？',
        'セルフサービス予約機能の要件を確認する質問です',
        80,
        false,
        '{"categoryMatches": ["予約", "スケジュール", "カレンダー"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'booking',
        '予約確認や通知機能は必要ですか？（例：メール通知、SMS通知など）',
        '通知機能の要件を確認する質問です',
        90,
        false,
        '{"categoryMatches": ["予約", "スケジュール", "カレンダー"]}'::jsonb
    ),
    (
        gen_random_uuid(),
        'booking',
        'オンライン決済機能は必要ですか？',
        '決済機能の要件を確認する質問です',
        100,
        false,
        '{"categoryMatches": ["予約", "スケジュール", "カレンダー"]}'::jsonb
    );

-- =====================
-- project_templates: プロジェクトテンプレート (過去案件データ)
-- =====================
INSERT INTO public.project_templates (id, user_id, name, category, description, features, actual_hours, actual_cost, content_embedding)
VALUES
    (
        gen_random_uuid(),
        NULL, -- NULLは共通テンプレート
        '小規模CRMシステム（顧客50社以下）',
        'crm',
        '小規模企業向けの基本的な顧客管理システム。顧客情報、対応履歴の管理が中心。',
        '[
            {
                "name": "ユーザー認証・権限管理",
                "description": "ログイン機能とユーザー権限の管理",
                "estimated_hours": 20,
                "unit_price": 200000,
                "complexity": "low"
            },
            {
                "name": "顧客基本情報管理",
                "description": "顧客の基本情報（会社名、担当者、連絡先など）の登録・編集・検索",
                "estimated_hours": 40,
                "unit_price": 400000,
                "complexity": "medium"
            },
            {
                "name": "対応履歴管理",
                "description": "顧客とのやり取りの履歴を記録・管理する機能",
                "estimated_hours": 30,
                "unit_price": 300000,
                "complexity": "medium"
            },
            {
                "name": "レポート・検索機能",
                "description": "顧客データの検索、基本的なレポート出力機能",
                "estimated_hours": 25,
                "unit_price": 250000,
                "complexity": "medium"
            },
            {
                "name": "データインポート",
                "description": "CSVからの顧客データインポート機能",
                "estimated_hours": 15,
                "unit_price": 150000,
                "complexity": "low"
            }
        ]'::jsonb,
        130, -- 実際工数（時間）
        1300000, -- 実際コスト（円）
        NULL -- エンベディングは後で生成
    ),
    (
        gen_random_uuid(),
        NULL,
        '中規模CRMシステム（顧客500社程度）',
        'crm',
        '中規模企業向けの顧客管理システム。顧客情報、商談管理、活動管理、レポート機能を含む。',
        '[
            {
                "name": "ユーザー認証・権限管理",
                "description": "複数権限レベルを持つユーザー管理システム",
                "estimated_hours": 30,
                "unit_price": 300000,
                "complexity": "medium"
            },
            {
                "name": "顧客情報管理（高度）",
                "description": "顧客情報の詳細管理、履歴管理、添付ファイル管理",
                "estimated_hours": 60,
                "unit_price": 600000,
                "complexity": "high"
            },
            {
                "name": "商談・案件管理",
                "description": "商談の進捗管理、確度管理、予算管理などの機能",
                "estimated_hours": 70,
                "unit_price": 700000,
                "complexity": "high"
            },
            {
                "name": "活動管理・カレンダー連携",
                "description": "営業活動の記録、スケジュール管理、カレンダー連携",
                "estimated_hours": 50,
                "unit_price": 500000,
                "complexity": "medium"
            },
            {
                "name": "高度なレポート・分析機能",
                "description": "カスタマイズ可能なレポート、ダッシュボード、分析機能",
                "estimated_hours": 80,
                "unit_price": 800000,
                "complexity": "high"
            },
            {
                "name": "メール連携",
                "description": "メールの送受信履歴の管理、テンプレート機能",
                "estimated_hours": 40,
                "unit_price": 400000,
                "complexity": "medium"
            },
            {
                "name": "データインポート・エクスポート",
                "description": "様々な形式でのデータ入出力機能",
                "estimated_hours": 25,
                "unit_price": 250000,
                "complexity": "medium"
            },
            {
                "name": "モバイル対応",
                "description": "スマートフォン・タブレット向けレスポンシブ対応",
                "estimated_hours": 60,
                "unit_price": 600000,
                "complexity": "high"
            }
        ]'::jsonb,
        430, -- 実際工数（時間）
        4150000, -- 実際コスト（円）
        NULL
    ),
    (
        gen_random_uuid(),
        NULL,
        '基本的な在庫管理システム',
        'inventory',
        '小規模事業者向けの基本的な在庫管理システム。商品、在庫数、入出庫管理の基本機能を含む。',
        '[
            {
                "name": "ユーザー認証・権限管理",
                "description": "ログイン機能とユーザー権限の管理",
                "estimated_hours": 20,
                "unit_price": 200000,
                "complexity": "low"
            },
            {
                "name": "商品マスタ管理",
                "description": "商品情報の登録・編集・検索機能",
                "estimated_hours": 35,
                "unit_price": 350000,
                "complexity": "medium"
            },
            {
                "name": "在庫数管理",
                "description": "現在庫数の管理、閾値設定とアラート機能",
                "estimated_hours": 30,
                "unit_price": 300000,
                "complexity": "medium"
            },
            {
                "name": "入出庫管理",
                "description": "入庫・出庫処理と履歴管理",
                "estimated_hours": 40,
                "unit_price": 400000,
                "complexity": "medium"
            },
            {
                "name": "基本レポート機能",
                "description": "在庫状況、入出庫履歴などの基本レポート",
                "estimated_hours": 25,
                "unit_price": 250000,
                "complexity": "medium"
            },
            {
                "name": "データインポート",
                "description": "CSVからの商品データインポート機能",
                "estimated_hours": 15,
                "unit_price": 150000,
                "complexity": "low"
            }
        ]'::jsonb,
        170, -- 実際工数（時間）
        1650000, -- 実際コスト（円）
        NULL
    ),
    (
        gen_random_uuid(),
        NULL,
        '高度な在庫管理システム（バーコード対応）',
        'inventory',
        '中規模事業者向けの高度な在庫管理システム。バーコード対応、複数倉庫管理、発注管理などを含む。',
        '[
            {
                "name": "ユーザー認証・権限管理",
                "description": "複数権限レベルを持つユーザー管理システム",
                "estimated_hours": 30,
                "unit_price": 300000,
                "complexity": "medium"
            },
            {
                "name": "商品マスタ管理（高度）",
                "description": "商品情報の詳細管理、カテゴリ、タグ、画像管理",
                "estimated_hours": 60,
                "unit_price": 600000,
                "complexity": "high"
            },
            {
                "name": "バーコード・QRコード管理",
                "description": "バーコード/QRコード生成、スキャン機能、ラベル印刷",
                "estimated_hours": 80,
                "unit_price": 800000,
                "complexity": "high"
            },
            {
                "name": "複数倉庫・ロケーション管理",
                "description": "複数倉庫、棚・位置管理、在庫移動機能",
                "estimated_hours": 70,
                "unit_price": 700000,
                "complexity": "high"
            },
            {
                "name": "入出庫管理（高度）",
                "description": "入出庫ワークフロー、承認フロー、履歴管理",
                "estimated_hours": 60,
                "unit_price": 600000,
                "complexity": "high"
            },
            {
                "name": "発注管理",
                "description": "発注処理、発注書生成、仕入先管理",
                "estimated_hours": 50,
                "unit_price": 500000,
                "complexity": "medium"
            },
            {
                "name": "在庫分析・予測",
                "description": "在庫回転率分析、需要予測、発注点算出",
                "estimated_hours": 90,
                "unit_price": 900000,
                "complexity": "high"
            },
            {
                "name": "モバイル・ハンディ端末対応",
                "description": "スマートフォン/タブレット対応、専用ハンディ端末連携",
                "estimated_hours": 100,
                "unit_price": 1000000,
                "complexity": "high"
            },
            {
                "name": "高度なレポート・ダッシュボード",
                "description": "カスタマイズ可能なレポート、リアルタイムダッシュボード",
                "estimated_hours": 70,
                "unit_price": 700000,
                "complexity": "high"
            }
        ]'::jsonb,
        620, -- 実際工数（時間）
        6100000, -- 実際コスト（円）
        NULL
    ),
    (
        gen_random_uuid(),
        NULL,
        '基本的な予約システム',
        'booking',
        '小規模サービス事業者向けの基本的な予約管理システム。リソース予約、カレンダー表示の基本機能を含む。',
        '[
            {
                "name": "ユーザー認証・権限管理",
                "description": "ログイン機能とユーザー権限の管理",
                "estimated_hours": 20,
                "unit_price": 200000,
                "complexity": "low"
            },
            {
                "name": "リソース管理",
                "description": "予約対象となるリソース（部屋、人員など）の管理",
                "estimated_hours": 30,
                "unit_price": 300000,
                "complexity": "medium"
            },
            {
                "name": "カレンダー表示",
                "description": "予約状況をカレンダー形式で表示する機能",
                "estimated_hours": 40,
                "unit_price": 400000,
                "complexity": "medium"
            },
            {
                "name": "予約登録・編集・キャンセル",
                "description": "予約の基本的な操作機能",
                "estimated_hours": 35,
                "unit_price": 350000,
                "complexity": "medium"
            },
            {
                "name": "顧客管理（基本）",
                "description": "予約者の基本情報管理",
                "estimated_hours": 25,
                "unit_price": 250000,
                "complexity": "low"
            },
            {
                "name": "メール通知",
                "description": "予約確認・変更通知などの基本的なメール送信機能",
                "estimated_hours": 20,
                "unit_price": 200000,
                "complexity": "low"
            }
        ]'::jsonb,
        180, -- 実際工数（時間）
        1700000, -- 実際コスト（円）
        NULL
    );


-- 注意: ベクトルエンベディングの生成は別途必要です。
-- 以下は、実際のシステム内でエンベディングを生成して更新するコードの例です。
-- このコメントはSQLの一部ではありません。

/*
// クライアントサイドでの実装例 - Gemini APIを使用
// Geminiの最新エンベディングモデル gemini-embedding-exp-03-07 を使用

// APIキーの設定
const GEMINI_API_KEY = 'あなたのGemini APIキー'; // 実際の環境で設定してください

// プロジェクトテンプレートのエンベディング生成
async function generateEmbeddings() {
  const projectTemplates = await supabase
    .from('project_templates')
    .select('*');

  for (const template of projectTemplates.data) {
    const textToEmbed = `
      名前: ${template.name}
      カテゴリ: ${template.category}
      説明: ${template.description}
      機能: ${JSON.stringify(template.features)}
    `;
    
    try {
      // Gemini APIを使ってエンベディングを生成
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-exp-03-07:embedContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'models/gemini-embedding-exp-03-07',
            content: {
              parts: [{ text: textToEmbed }]
            },
            taskType: 'SEMANTIC_SIMILARITY' // 意味的類似性検索に最適化
          })
        }
      );
      
      const data = await response.json();
      const embedding = data.embeddings?.values || [];
      
      // エンベディングを更新
      await supabase
        .from('project_templates')
        .update({ content_embedding: embedding })
        .eq('id', template.id);
        
      console.log(`Template ${template.id} のエンベディングを更新しました`);
    } catch (error) {
      console.error(`Template ${template.id} のエンベディング生成に失敗: ${error.message}`);
    }
  }
}

// 実行
generateEmbeddings();
*/

-- =====================
-- 初期ユーザーの登録
-- =====================
-- 注意: Supabase Auth UIを使うか、APIを使って実際のユーザーを登録し、
-- そのUUIDを使って以下のようなクエリを実行します。

/*
INSERT INTO public.users (id, email, full_name, company_name, role, created_at, updated_at)
VALUES 
(
  'ここにAuthから取得したUUID', 
  'example@example.com',
  'サンプル ユーザー',
  'サンプル株式会社',
  'admin',
  now(),
  now()
);
*/ 