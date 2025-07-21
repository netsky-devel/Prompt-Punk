import { PROMPT_LIMITS, PROVIDERS, ARCHITECTURES } from '../constants';
import type { AIProvider, PromptArchitecture } from '../types/api';

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Prompt validation
export const validatePrompt = (prompt: string): ValidationResult => {
  if (!prompt || prompt.trim().length === 0) {
    return { isValid: false, error: 'Prompt is required' };
  }

  if (prompt.length < PROMPT_LIMITS.MIN_LENGTH) {
    return { 
      isValid: false, 
      error: `Prompt must be at least ${PROMPT_LIMITS.MIN_LENGTH} characters` 
    };
  }

  if (prompt.length > PROMPT_LIMITS.MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Prompt must be less than ${PROMPT_LIMITS.MAX_LENGTH} characters` 
    };
  }

  return { isValid: true };
};

// API Key validation
export const validateApiKey = (apiKey: string, provider: AIProvider): ValidationResult => {
  if (!apiKey || apiKey.trim().length === 0) {
    return { isValid: false, error: 'API key is required' };
  }

  // Basic format validation by provider
  switch (provider) {
    case PROVIDERS.GOOGLE:
      if (!apiKey.startsWith('AI') || apiKey.length < 10) {
        return { isValid: false, error: 'Invalid Google API key format' };
      }
      break;
    case PROVIDERS.OPENAI:
      if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
        return { isValid: false, error: 'Invalid OpenAI API key format' };
      }
      break;
    case PROVIDERS.ANTHROPIC:
      if (!apiKey.startsWith('sk-ant-') || apiKey.length < 20) {
        return { isValid: false, error: 'Invalid Anthropic API key format' };
      }
      break;
  }

  return { isValid: true };
};

// Context validation
export const validateContext = (context: string): ValidationResult => {
  if (context.length > PROMPT_LIMITS.CONTEXT_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Context must be less than ${PROMPT_LIMITS.CONTEXT_MAX_LENGTH} characters` 
    };
  }
  return { isValid: true };
};

// Target audience validation
export const validateTargetAudience = (audience: string): ValidationResult => {
  if (audience.length > PROMPT_LIMITS.AUDIENCE_MAX_LENGTH) {
    return { 
      isValid: false, 
      error: `Target audience must be less than ${PROMPT_LIMITS.AUDIENCE_MAX_LENGTH} characters` 
    };
  }
  return { isValid: true };
};

// Provider validation
export const validateProvider = (provider: string): provider is AIProvider => {
  return Object.values(PROVIDERS).includes(provider as AIProvider);
};

// Architecture validation
export const validateArchitecture = (architecture: string): architecture is PromptArchitecture => {
  return Object.values(ARCHITECTURES).includes(architecture as PromptArchitecture);
};

// Max rounds validation
export const validateMaxRounds = (maxRounds: number): ValidationResult => {
  if (maxRounds < 1) {
    return { isValid: false, error: 'Max rounds must be at least 1' };
  }
  if (maxRounds > 20) {
    return { isValid: false, error: 'Max rounds must be no more than 20' };
  }
  return { isValid: true };
};

// Model name validation
export const validateModelName = (modelName: string): ValidationResult => {
  if (!modelName || modelName.trim().length === 0) {
    return { isValid: false, error: 'Model name is required' };
  }
  return { isValid: true };
};

// Comprehensive task validation
export const validateTaskData = (data: {
  prompt: string;
  provider: string;
  modelName: string;
  apiKey: string;
  context?: string;
  targetAudience?: string;
  maxRounds?: number;
}) => {
  const errors: string[] = [];

  // Validate prompt
  const promptResult = validatePrompt(data.prompt);
  if (!promptResult.isValid) errors.push(promptResult.error!);

  // Validate provider
  if (!validateProvider(data.provider)) {
    errors.push('Invalid provider selected');
  }

  // Validate model
  const modelResult = validateModelName(data.modelName);
  if (!modelResult.isValid) errors.push(modelResult.error!);

  // Validate API key
  const apiKeyResult = validateApiKey(data.apiKey, data.provider as AIProvider);
  if (!apiKeyResult.isValid) errors.push(apiKeyResult.error!);

  // Validate optional fields
  if (data.context) {
    const contextResult = validateContext(data.context);
    if (!contextResult.isValid) errors.push(contextResult.error!);
  }

  if (data.targetAudience) {
    const audienceResult = validateTargetAudience(data.targetAudience);
    if (!audienceResult.isValid) errors.push(audienceResult.error!);
  }

  if (data.maxRounds !== undefined) {
    const roundsResult = validateMaxRounds(data.maxRounds);
    if (!roundsResult.isValid) errors.push(roundsResult.error!);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}; 