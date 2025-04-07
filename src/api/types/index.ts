import { Database, type Tables } from "./supabase";

// Supabaseから型の再エクスポート
export type SystemCategory = Tables<"system_categories">;
export type QuestionTemplate = Tables<"question_templates">;
export type Project = Tables<"estimates">;
export type ProjectRequirement = {
	id: string;
	project_id: string;
	requirement: string;
	created_at: string;
};
export type ProjectQuestion = Tables<"estimate_questions">;
export type ProjectAnswer = {
	question_id: string;
	answer: string;
};
export type ProjectFeature = {
	id: string;
	project_id: string;
	name: string;
	description: string;
	estimated_hours: number;
	created_at: string;
};
export type ProjectEstimate = Tables<"estimates">;

// 初期要件入力API向けのインターフェース
export interface InitialRequirementRequest {
	description: string;
	organization?: string;
	industry?: string;
	budget?: number;
	timeline?: string;
	session_id?: string;
}

export interface InitialRequirementResponse {
	id: string;
	session_id: string;
	status: "success" | "error";
	message?: string;
}

// 質問生成API向けのインターフェース
export interface QuestionsResponse {
	questions: {
		id: string;
		template_id?: string;
		question: string;
		category: string;
		position: number;
		is_required?: boolean;
	}[];
	total: number;
	session_id: string;
}

// 質問回答API向けのインターフェース
export interface AnswerQuestionRequest {
	session_id: string;
	question_id: string;
	answer: string;
}

export interface AnswerQuestionResponse {
	success: boolean;
	remaining_questions: number;
	session_id: string;
}

// 見積もり結果API向けのインターフェース
export interface EstimateResultResponse {
	id: string;
	session_id: string;
	items: {
		id: string;
		name: string;
		description?: string;
		complexity?: string;
		estimated_hours?: number;
		unit_price: number;
		quantity: number;
		is_required?: boolean;
	}[];
	total_amount: number;
	pdf_url?: string;
}
