import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// 環境変数の読み込み
dotenv.config();

// Supabaseの接続設定
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

// 環境変数が設定されているか確認
if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		"Supabase環境変数が設定されていません。.envファイルを確認してください。",
	);
}

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false, // セッションを永続化しない（テスト用）
	},
});

// セッションIDを設定するヘルパー関数
export const setSessionContext = async (sessionId: string): Promise<void> => {
	try {
		// app.current_session_id設定を行う
		const { error } = await supabase.rpc("set_app_setting", {
			name: "current_session_id",
			value: sessionId,
		});

		if (error) {
			throw error;
		}

		console.log(`セッションID「${sessionId}」を設定しました`);
	} catch (error) {
		console.error("セッションIDの設定に失敗しました:", error);
		throw error;
	}
};
