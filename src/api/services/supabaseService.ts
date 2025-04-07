import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/supabase";

// 環境変数からSupabase接続情報を取得
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

// 接続情報が設定されていない場合はエラーをスロー
if (!supabaseUrl || !supabaseKey) {
	throw new Error(
		"Supabase環境変数が設定されていません。SUPABASE_URLとSUPABASE_KEYを確認してください。",
	);
}

// Supabaseクライアントを初期化
const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
