// API Configuration
export const API_BASE_URL = 'http://localhost:3000/api/v1';

// Provider Configuration
export const PROVIDERS = {
  GOOGLE: 'google',
  OPENAI: 'openai', 
  ANTHROPIC: 'anthropic',
} as const;

export const DEFAULT_MODELS = {
  [PROVIDERS.GOOGLE]: 'gemini-1.5-pro',
  [PROVIDERS.OPENAI]: 'gpt-4',
  [PROVIDERS.ANTHROPIC]: 'claude-3-sonnet-20240229',
} as const;

// Architecture Types - synced with backend
export const ARCHITECTURES = {
  AUTO: 'auto',
  CHAIN_OF_THOUGHT: 'chain_of_thought',
  META_COGNITIVE: 'meta_cognitive',
  FIVE_TIER_FRAMEWORK: '5_tier_framework',
} as const;

export const ARCHITECTURE_LABELS = {
  [ARCHITECTURES.AUTO]: '🤖 Auto-Optimized',
  [ARCHITECTURES.CHAIN_OF_THOUGHT]: '🔗 Chain of Thought', 
  [ARCHITECTURES.META_COGNITIVE]: '🧠 Meta-Cognitive',
  [ARCHITECTURES.FIVE_TIER_FRAMEWORK]: '🏗️ 5-Tier Framework',
} as const;

// Task Configuration
export const TASK_TYPES = {

  MULTI_AGENT: 'multi_agent',
} as const;

export const DEFAULT_SETTINGS = {
  TEMPERATURE: 0.7,
  MAX_TOKENS: 2000,
  MAX_ROUNDS: 5,
  POLLING_INTERVAL: 2000, // ms
  MAX_RETRIES: 3,
} as const;

// UI Configuration
export const PROMPT_LIMITS = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 10000,
  CONTEXT_MAX_LENGTH: 1000,
  AUDIENCE_MAX_LENGTH: 500,
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  PROVIDER_SETTINGS: 'prompt-improver-provider-settings',
  USER_PREFERENCES: 'prompt-improver-user-preferences',
} as const; 