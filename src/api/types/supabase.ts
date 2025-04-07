export type Json =
	| string
	| number
	| boolean
	| null
	| { [key: string]: Json | undefined }
	| Json[];

export interface Database {
	public: {
		Tables: {
			business_analyses: {
				Row: {
					id: string;
					estimate_id: string | null;
					temporary_estimate_id: string | null;
					created_at: string;
					updated_at: string;
					cost_optimization: Json | null;
					roi_analysis: Json | null;
					efficiency_prediction: Json | null;
					scalability_analysis: Json | null;
					industry: string | null;
					company_size: number | null;
					current_process_hours: number | null;
					session_id: string | null;
				};
				Insert: {
					id?: string;
					estimate_id?: string | null;
					temporary_estimate_id?: string | null;
					created_at?: string;
					updated_at?: string;
					cost_optimization?: Json | null;
					roi_analysis?: Json | null;
					efficiency_prediction?: Json | null;
					scalability_analysis?: Json | null;
					industry?: string | null;
					company_size?: number | null;
					current_process_hours?: number | null;
					session_id?: string | null;
				};
				Update: {
					id?: string;
					estimate_id?: string | null;
					temporary_estimate_id?: string | null;
					created_at?: string;
					updated_at?: string;
					cost_optimization?: Json | null;
					roi_analysis?: Json | null;
					efficiency_prediction?: Json | null;
					scalability_analysis?: Json | null;
					industry?: string | null;
					company_size?: number | null;
					current_process_hours?: number | null;
					session_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_analyses_estimate_id_fkey";
						columns: ["estimate_id"];
						referencedRelation: "estimates";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "business_analyses_temporary_estimate_id_fkey";
						columns: ["temporary_estimate_id"];
						referencedRelation: "temporary_estimates";
						referencedColumns: ["id"];
					},
				];
			};
			business_analysis_reports: {
				Row: {
					id: string;
					business_analysis_id: string;
					created_at: string;
					report_url: string;
					report_type: string;
					session_id: string | null;
				};
				Insert: {
					id?: string;
					business_analysis_id: string;
					created_at?: string;
					report_url: string;
					report_type: string;
					session_id?: string | null;
				};
				Update: {
					id?: string;
					business_analysis_id?: string;
					created_at?: string;
					report_url?: string;
					report_type?: string;
					session_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "business_analysis_reports_business_analysis_id_fkey";
						columns: ["business_analysis_id"];
						referencedRelation: "business_analyses";
						referencedColumns: ["id"];
					},
				];
			};
			clients: {
				Row: {
					id: string;
					user_id: string;
					name: string;
					company: string | null;
					email: string | null;
					phone: string | null;
					notes: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					user_id: string;
					name: string;
					company?: string | null;
					email?: string | null;
					phone?: string | null;
					notes?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					user_id?: string;
					name?: string;
					company?: string | null;
					email?: string | null;
					phone?: string | null;
					notes?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "clients_user_id_fkey";
						columns: ["user_id"];
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			email_notifications: {
				Row: {
					id: string;
					email: string;
					temporary_estimate_id: string | null;
					estimate_id: string | null;
					sent_at: string | null;
					status: string;
					content: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					email: string;
					temporary_estimate_id?: string | null;
					estimate_id?: string | null;
					sent_at?: string | null;
					status?: string;
					content?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					email?: string;
					temporary_estimate_id?: string | null;
					estimate_id?: string | null;
					sent_at?: string | null;
					status?: string;
					content?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "email_notifications_estimate_id_fkey";
						columns: ["estimate_id"];
						referencedRelation: "estimates";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "email_notifications_temporary_estimate_id_fkey";
						columns: ["temporary_estimate_id"];
						referencedRelation: "temporary_estimates";
						referencedColumns: ["id"];
					},
				];
			};
			estimate_items: {
				Row: {
					id: string;
					estimate_id: string;
					name: string;
					description: string | null;
					quantity: number;
					unit_price: number;
					is_required: boolean | null;
					complexity: string | null;
					estimated_hours: number | null;
					is_selected: boolean | null;
					position: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					estimate_id: string;
					name: string;
					description?: string | null;
					quantity?: number;
					unit_price: number;
					is_required?: boolean | null;
					complexity?: string | null;
					estimated_hours?: number | null;
					is_selected?: boolean | null;
					position?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					estimate_id?: string;
					name?: string;
					description?: string | null;
					quantity?: number;
					unit_price?: number;
					is_required?: boolean | null;
					complexity?: string | null;
					estimated_hours?: number | null;
					is_selected?: boolean | null;
					position?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "estimate_items_estimate_id_fkey";
						columns: ["estimate_id"];
						referencedRelation: "estimates";
						referencedColumns: ["id"];
					},
				];
			};
			estimate_questions: {
				Row: {
					id: string;
					estimate_id: string;
					question: string;
					answer: string | null;
					position: number;
					is_answered: boolean | null;
					template_id: string | null;
					category: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					estimate_id: string;
					question: string;
					answer?: string | null;
					position?: number;
					is_answered?: boolean | null;
					template_id?: string | null;
					category?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					estimate_id?: string;
					question?: string;
					answer?: string | null;
					position?: number;
					is_answered?: boolean | null;
					template_id?: string | null;
					category?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "estimate_questions_estimate_id_fkey";
						columns: ["estimate_id"];
						referencedRelation: "estimates";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "estimate_questions_template_id_fkey";
						columns: ["template_id"];
						referencedRelation: "question_templates";
						referencedColumns: ["id"];
					},
				];
			};
			estimates: {
				Row: {
					id: string;
					user_id: string | null;
					client_id: string | null;
					title: string;
					description: string | null;
					initial_requirements: string;
					total_amount: number | null;
					status: string;
					expiry_date: string | null;
					created_at: string;
					updated_at: string;
					pdf_url: string | null;
					metadata: Json | null;
					session_id: string | null;
				};
				Insert: {
					id?: string;
					user_id?: string | null;
					client_id?: string | null;
					title: string;
					description?: string | null;
					initial_requirements: string;
					total_amount?: number | null;
					status?: string;
					expiry_date?: string | null;
					created_at?: string;
					updated_at?: string;
					pdf_url?: string | null;
					metadata?: Json | null;
					session_id?: string | null;
				};
				Update: {
					id?: string;
					user_id?: string | null;
					client_id?: string | null;
					title?: string;
					description?: string | null;
					initial_requirements?: string;
					total_amount?: number | null;
					status?: string;
					expiry_date?: string | null;
					created_at?: string;
					updated_at?: string;
					pdf_url?: string | null;
					metadata?: Json | null;
					session_id?: string | null;
				};
				Relationships: [
					{
						foreignKeyName: "estimates_client_id_fkey";
						columns: ["client_id"];
						referencedRelation: "clients";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "estimates_user_id_fkey";
						columns: ["user_id"];
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			industry_benchmarks: {
				Row: {
					id: string;
					industry: string;
					created_at: string;
					updated_at: string;
					average_savings_rate: number;
					average_roi: number;
					efficiency_metrics: Json | null;
					data_source: string | null;
				};
				Insert: {
					id?: string;
					industry: string;
					created_at?: string;
					updated_at?: string;
					average_savings_rate: number;
					average_roi: number;
					efficiency_metrics?: Json | null;
					data_source?: string | null;
				};
				Update: {
					id?: string;
					industry?: string;
					created_at?: string;
					updated_at?: string;
					average_savings_rate?: number;
					average_roi?: number;
					efficiency_metrics?: Json | null;
					data_source?: string | null;
				};
				Relationships: [];
			};
			project_templates: {
				Row: {
					id: string;
					user_id: string | null;
					name: string;
					category: string;
					description: string | null;
					features: Json;
					actual_hours: number | null;
					actual_cost: number | null;
					created_at: string;
					updated_at: string;
					content_embedding: unknown | null;
				};
				Insert: {
					id?: string;
					user_id?: string | null;
					name: string;
					category: string;
					description?: string | null;
					features: Json;
					actual_hours?: number | null;
					actual_cost?: number | null;
					created_at?: string;
					updated_at?: string;
					content_embedding?: unknown | null;
				};
				Update: {
					id?: string;
					user_id?: string | null;
					name?: string;
					category?: string;
					description?: string | null;
					features?: Json;
					actual_hours?: number | null;
					actual_cost?: number | null;
					created_at?: string;
					updated_at?: string;
					content_embedding?: unknown | null;
				};
				Relationships: [
					{
						foreignKeyName: "project_templates_user_id_fkey";
						columns: ["user_id"];
						referencedRelation: "users";
						referencedColumns: ["id"];
					},
				];
			};
			question_templates: {
				Row: {
					id: string;
					category: string;
					question: string;
					description: string | null;
					position: number;
					is_required: boolean | null;
					conditions: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					category: string;
					question: string;
					description?: string | null;
					position?: number;
					is_required?: boolean | null;
					conditions?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					category?: string;
					question?: string;
					description?: string | null;
					position?: number;
					is_required?: boolean | null;
					conditions?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			system_categories: {
				Row: {
					id: string;
					name: string;
					description: string | null;
					keywords: Json | null;
					default_questions: Json | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					name: string;
					description?: string | null;
					keywords?: Json | null;
					default_questions?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					name?: string;
					description?: string | null;
					keywords?: Json | null;
					default_questions?: Json | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [];
			};
			temporary_estimate_items: {
				Row: {
					id: string;
					temporary_estimate_id: string;
					name: string;
					description: string | null;
					quantity: number;
					unit_price: number;
					is_required: boolean | null;
					complexity: string | null;
					estimated_hours: number | null;
					is_selected: boolean | null;
					position: number;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					temporary_estimate_id: string;
					name: string;
					description?: string | null;
					quantity?: number;
					unit_price: number;
					is_required?: boolean | null;
					complexity?: string | null;
					estimated_hours?: number | null;
					is_selected?: boolean | null;
					position?: number;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					temporary_estimate_id?: string;
					name?: string;
					description?: string | null;
					quantity?: number;
					unit_price?: number;
					is_required?: boolean | null;
					complexity?: string | null;
					estimated_hours?: number | null;
					is_selected?: boolean | null;
					position?: number;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "temporary_estimate_items_temporary_estimate_id_fkey";
						columns: ["temporary_estimate_id"];
						referencedRelation: "temporary_estimates";
						referencedColumns: ["id"];
					},
				];
			};
			temporary_estimate_questions: {
				Row: {
					id: string;
					temporary_estimate_id: string;
					question: string;
					answer: string | null;
					position: number;
					is_answered: boolean | null;
					template_id: string | null;
					category: string | null;
					created_at: string;
					updated_at: string;
				};
				Insert: {
					id?: string;
					temporary_estimate_id: string;
					question: string;
					answer?: string | null;
					position?: number;
					is_answered?: boolean | null;
					template_id?: string | null;
					category?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Update: {
					id?: string;
					temporary_estimate_id?: string;
					question?: string;
					answer?: string | null;
					position?: number;
					is_answered?: boolean | null;
					template_id?: string | null;
					category?: string | null;
					created_at?: string;
					updated_at?: string;
				};
				Relationships: [
					{
						foreignKeyName: "temporary_estimate_questions_template_id_fkey";
						columns: ["template_id"];
						referencedRelation: "question_templates";
						referencedColumns: ["id"];
					},
					{
						foreignKeyName: "temporary_estimate_questions_temporary_estimate_id_fkey";
						columns: ["temporary_estimate_id"];
						referencedRelation: "temporary_estimates";
						referencedColumns: ["id"];
					},
				];
			};
			temporary_estimates: {
				Row: {
					id: string;
					session_id: string;
					email: string | null;
					title: string;
					description: string | null;
					initial_requirements: string;
					total_amount: number | null;
					status: string;
					created_at: string;
					updated_at: string;
					expires_at: string;
					pdf_url: string | null;
					metadata: Json | null;
				};
				Insert: {
					id?: string;
					session_id: string;
					email?: string | null;
					title?: string;
					description?: string | null;
					initial_requirements: string;
					total_amount?: number | null;
					status?: string;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
					pdf_url?: string | null;
					metadata?: Json | null;
				};
				Update: {
					id?: string;
					session_id?: string;
					email?: string | null;
					title?: string;
					description?: string | null;
					initial_requirements?: string;
					total_amount?: number | null;
					status?: string;
					created_at?: string;
					updated_at?: string;
					expires_at?: string;
					pdf_url?: string | null;
					metadata?: Json | null;
				};
				Relationships: [];
			};
		};
		Views: {
			[_ in never]: never;
		};
		Functions: {
			[_ in never]: never;
		};
		Enums: {
			[_ in never]: never;
		};
		CompositeTypes: {
			[_ in never]: never;
		};
	};
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
	Database["public"]["Tables"][T]["Update"];
