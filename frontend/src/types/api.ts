export type PromptArchitecture = 
  | 'auto'
  | '5_tier'
  | 'chain_of_thought'
  | 'zero_shot'
  | 'few_shot'
  | 'emotional'
  | 'structured'

export interface PromptRequest {
  original_prompt: string
  architecture?: PromptArchitecture
  context?: string
  target_audience?: string
}

export interface PromptAnalysis {
  main_goal: string
  identified_problems: string[]
  improvement_potential: string
  missing_elements: string[]
}

export interface AppliedTechnique {
  name: string
  description: string
  expected_effect: string
}

export interface PromptImprovement {
  applied_techniques: AppliedTechnique[]
  expected_results: string[]
  quality_score: number
}

export interface PromptResponse {
  analysis: PromptAnalysis
  improved_prompt: string
  improvements: PromptImprovement
  architecture_used: PromptArchitecture
}

export interface ArchitectureOption {
  id: PromptArchitecture
  name: string
  description: string
}

export interface HealthCheck {
  status: string
  version: string
  gemini_connected: boolean
}

export interface ApiError {
  detail: string
} 