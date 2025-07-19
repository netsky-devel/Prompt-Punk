export type PromptArchitecture = 
  | 'auto'
  | '5_tier'
  | 'chain_of_thought'
  | 'zero_shot'
  | 'few_shot'
  | 'emotional'
  | 'structured'

export type AIProvider = 
  | 'google'
  | 'openai'
  | 'anthropic'

export interface ProviderSettings {
  provider: AIProvider
  model_name: string
  api_key: string
  temperature?: number
  max_tokens?: number
}

export interface PromptRequest {
  original_prompt: string
  provider_settings: ProviderSettings
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
  provider_used: string
  model_used: string
}

export interface ArchitectureOption {
  id: PromptArchitecture
  name: string
  description: string
}

export interface ProviderModel {
  provider: AIProvider
  models: string[]
  default_model: string
}

export interface ProvidersResponse {
  providers: ProviderModel[]
}

export interface HealthCheck {
  status: string
  version: string
  supported_providers: string[]
}

export interface ConnectionTestResult {
  provider: string
  model: string
  connected: boolean
  status: 'success' | 'failed'
}

export interface ApiError {
  detail: string
} 