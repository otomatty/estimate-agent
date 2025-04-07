// 一時見積もりの型定義
export interface TemporaryEstimate {
	id: string;
	session_id: string;
	email?: string;
	title: string;
	description?: string;
	initial_requirements: string;
	total_amount?: number;
	status:
		| "draft"
		| "requirements"
		| "questions"
		| "features"
		| "review"
		| "completed";
	created_at: string;
	updated_at: string;
	expires_at: string;
	pdf_url?: string;
	metadata?: Record<string, any>;
}

// 一時見積もり項目の型定義
export interface TemporaryEstimateItem {
	id: string;
	temporary_estimate_id: string;
	name: string;
	description?: string;
	quantity: number;
	unit_price: number;
	is_required: boolean;
	complexity?: "low" | "medium" | "high";
	estimated_hours?: number;
	is_selected: boolean;
	position: number;
	created_at: string;
	updated_at: string;
}

// 一時見積もり質問の型定義
export interface TemporaryEstimateQuestion {
	id: string;
	temporary_estimate_id: string;
	question: string;
	answer?: string;
	position: number;
	is_answered: boolean;
	template_id?: string;
	category?: string;
	created_at: string;
	updated_at: string;
}

// 質問テンプレートの型定義
export interface QuestionTemplate {
	id: string;
	category: string;
	question: string;
	description?: string;
	position: number;
	is_required: boolean;
	conditions?: Record<string, any>;
	created_at: string;
	updated_at: string;
}

// ビジネス分析の型定義
export interface BusinessAnalysis {
	id: string;
	estimate_id?: string;
	temporary_estimate_id?: string;
	created_at: string;
	updated_at: string;
	cost_optimization?: Record<string, any>;
	roi_analysis?: Record<string, any>;
	efficiency_prediction?: Record<string, any>;
	scalability_analysis?: Record<string, any>;
	industry?: string;
	company_size?: number;
	current_process_hours?: number;
	session_id?: string;
}

// 新規見積もり作成時の入力
export interface CreateEstimateInput {
	sessionId: string;
	title: string;
	initialRequirements: string;
	description?: string;
}

// 質問回答の入力
export interface AnswerQuestionInput {
	questionId: string;
	answer: string;
}

// 見積もり項目選択の入力
export interface SelectEstimateItemInput {
	itemId: string;
	isSelected: boolean;
}
