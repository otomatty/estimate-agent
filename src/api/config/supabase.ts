import { createClient } from "@supabase/supabase-js";
import { env } from "./env";

// Supabaseクライアントを初期化
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
	auth: {
		persistSession: false,
	},
});
