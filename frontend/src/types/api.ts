// Backend API Types based on Rails models and controllers

export interface Task {
  task_id: number;
  original_prompt: string;
  provider: string;
  ai_model: string;
  improvement_type: 'single_agent' | 'multi_agent';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  max_rounds?: number;
  context?: string;
  target_audience?: string;
  architecture?: string;
  created_at: string;
  updated_at: string;
  started_at?: string;
  completed_at?: string;
  processing_time?: number;
}

export interface TaskImprovement {
  id: number;
  improved_prompt: string;
  analysis: {
    main_goal?: string;
    identified_problems?: string[];
    improvement_potential?: string;
    missing_elements?: string[];
  };
  improvements_metadata: Record<string, any>;
  provider_used: string;
  ai_model_used: string;
  architecture_used?: string;
  quality_score: number;
  quality_rating: string;
  quality_emoji: string;
  processing_time_seconds: number;
  formatted_processing_time: string;
}

export interface MultiAgentSession {
  id: number;
  current_round: number;
  rounds_completed: number;
  final_decision: string;
  feedback_history: any[];
  feedback_count: number;
  latest_recommendation: string;
  progress_percentage: number;
  session_summary: string;
}

export interface TaskStatus {
  task_id: number;
  status: Task['status'];
  progress: number;
  started_at?: string;
  completed_at?: string;
  processing_time?: number;
  // Multi-agent specific fields
  current_round?: number;
  max_rounds?: number;
  rounds_completed?: number;
  latest_feedback?: string;
  session_progress?: number;
}

export interface TaskResult {
  task: Task;
  improvement?: TaskImprovement;
  session?: MultiAgentSession;
}

export interface RecentTask {
  task_id: number;
  original_prompt: string;
  status: Task['status'];
  improvement_type: Task['improvement_type'];
  provider: string;
  ai_model: string;
  created_at: string;
  processing_time?: string;
  quality_score?: number;
  quality_emoji?: string;
  has_result: boolean;
}

export interface CreateTaskRequest {
  task: {
    original_prompt: string;
    provider: string;
    ai_model: string;
    improvement_type: 'multi_agent';
    max_rounds?: number;
    context?: string;
    target_audience?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface Provider {
  name: string;
  display_name: string;
  models: string[];
  requires_api_key: boolean;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'task_progress' | 'task_completed' | 'task_failed' | 'ping';
  task_id?: number;
  status?: Task['status'];
  progress?: number;
  message?: string;
  step?: string;
  error?: string;
}

export interface WebSocketSubscription {
  command: 'subscribe' | 'unsubscribe';
  identifier: string;
}

export interface WebSocketAction {
  action: 'cancel_task';
  task_id: number;
}
