import { PROVIDERS, ARCHITECTURES, TASK_TYPES } from '../constants';

// Base types
export type AIProvider = typeof PROVIDERS[keyof typeof PROVIDERS];
export type PromptArchitecture = typeof ARCHITECTURES[keyof typeof ARCHITECTURES];
export type TaskType = typeof TASK_TYPES[keyof typeof TASK_TYPES];

// Provider Settings
export interface ProviderSettings {
  provider: AIProvider;
  ai_model: string;
  api_key: string;
}

// Task Creation
export interface CreateTaskRequest {
  original_prompt: string;
  provider: AIProvider;
  ai_model: string;
  improvement_type: TaskType;
  architecture?: PromptArchitecture;
  max_rounds?: number;
  context?: string;
  target_audience?: string;
}

// Task Response (from backend)
export interface Task {
  task_id: number;
  original_prompt: string;
  provider: AIProvider;
  ai_model: string;
  improvement_type: TaskType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  architecture?: PromptArchitecture;
  max_rounds?: number;
  context?: string;
  target_audience?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  processing_time?: number;
}

// Task Status Response
export interface TaskStatus {
  task: Task;
  progress: number;
  current_round?: number;
  session?: MultiAgentSession;
}

// Multi-Agent Session
export interface MultiAgentSession {
  id: number;
  current_round: number;
  rounds_completed: number;
  feedback_history: Record<string, any>;
  final_decision?: string;
  session_metadata: Record<string, any>;
}

// Prompt Analysis
export interface PromptAnalysis {
  main_goal: string;
  identified_problems: string[];
  improvement_potential: string;
  missing_elements?: string[];
}

// Applied Technique
export interface AppliedTechnique {
  name: string;
  description: string;
  expected_effect: string;
}

// Prompt Improvements
export interface PromptImprovements {
  applied_techniques: AppliedTechnique[];
  expected_results: string[];
  quality_score: number;
}

// Prompt Improvement Result
export interface PromptImprovement {
  id: number;
  improved_prompt: string;
  analysis: PromptAnalysis;
  improvements_metadata: PromptImprovements;
  provider_used: AIProvider;
  ai_model_used: string;
  architecture_used: PromptArchitecture;
  quality_score: number;
  processing_time_seconds: number;
  formatted_processing_time: string;
  quality_rating: string;
  quality_emoji: string;
}

// Complete Task Result
export interface TaskResult {
  task: Task;
  improvement: PromptImprovement;
  session?: MultiAgentSession;
}

// API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  details?: string[];
}

// Recent Tasks
export interface RecentTask {
  task_id: number;
  status: Task['status'];
  improvement_type: TaskType;
  provider: AIProvider;
  created_at: string;
  processing_time?: number;
  quality_score?: number;
  quality_emoji?: string;
  has_result: boolean;
}

// Health Check
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  database: 'connected' | 'disconnected';
  redis: 'connected' | 'disconnected';
  sidekiq: 'running' | 'stopped';
  langchain: 'available' | 'unavailable';
  providers: Record<AIProvider, 'available' | 'unavailable'>;
} 