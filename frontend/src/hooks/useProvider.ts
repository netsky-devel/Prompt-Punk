import { useCallback } from 'react';
import { useAppContext } from '../stores/AppContext';
import { apiClient } from '../api/client';
import { validateApiKey, validateProvider, validateModelName } from '../utils/validation';
import { PROVIDERS, DEFAULT_MODELS } from '../constants';
import type { ProviderSettings, AIProvider } from '../types/api';

export const useProvider = () => {
  const { state, setProviderSettings, setProviderValidity, setError, clearError } = useAppContext();

  // Update provider settings
  const updateProviderSettings = useCallback((updates: Partial<ProviderSettings>) => {
    if (!state.providerSettings) return;

    const newSettings = { ...state.providerSettings, ...updates };
    
    // If provider changes, update model to default
    if (updates.provider && updates.provider !== state.providerSettings.provider) {
      newSettings.ai_model = DEFAULT_MODELS[updates.provider];
    }

    setProviderSettings(newSettings);
    
    // Reset validity when settings change
    setProviderValidity(false);
    clearError('provider');
  }, [state.providerSettings, setProviderSettings, setProviderValidity, clearError]);

  // Validate current provider settings
  const validateCurrentSettings = useCallback(() => {
    if (!state.providerSettings) {
      setError('provider', 'Provider settings are required');
      return false;
    }

    const { provider, ai_model, api_key } = state.providerSettings;

    // Validate provider
    if (!validateProvider(provider)) {
      setError('provider', 'Invalid provider selected');
      return false;
    }

    // Validate model
    const modelValidation = validateModelName(ai_model);
    if (!modelValidation.isValid) {
      setError('provider', modelValidation.error!);
      return false;
    }

    // Validate API key
    const apiKeyValidation = validateApiKey(api_key, provider);
    if (!apiKeyValidation.isValid) {
      setError('provider', apiKeyValidation.error!);
      return false;
    }

    clearError('provider');
    return true;
  }, [state.providerSettings, setError, clearError]);

  // Test API key validity
  const testApiKey = useCallback(async () => {
    if (!state.providerSettings) {
      setError('provider', 'Provider settings are required');
      return false;
    }

    // First validate format
    if (!validateCurrentSettings()) {
      return false;
    }

    try {
      clearError('provider');
      
      const isValid = await apiClient.testApiKey(state.providerSettings.api_key);
      
      setProviderValidity(isValid);
      
      if (!isValid) {
        setError('provider', 'API key test failed. Please check your key and try again.');
      }
      
      return isValid;
    } catch (error) {
      console.error('Error testing API key:', error);
      setError('provider', 'Failed to test API key. Please check your internet connection.');
      setProviderValidity(false);
      return false;
    }
  }, [state.providerSettings, validateCurrentSettings, setProviderValidity, setError, clearError]);

  // Set provider
  const setProvider = useCallback((provider: AIProvider) => {
    updateProviderSettings({ 
      provider,
      ai_model: DEFAULT_MODELS[provider] 
    });
  }, [updateProviderSettings]);

  // Set model
  const setModel = useCallback((ai_model: string) => {
    updateProviderSettings({ ai_model });
  }, [updateProviderSettings]);

  // Set API key
  const setApiKey = useCallback((api_key: string) => {
    updateProviderSettings({ api_key });
  }, [updateProviderSettings]);

  // Get available providers
  const getAvailableProviders = useCallback(() => {
    return Object.entries(PROVIDERS).map(([key, value]) => ({
      value,
      label: key.charAt(0).toUpperCase() + key.slice(1).toLowerCase(),
      defaultModel: DEFAULT_MODELS[value],
    }));
  }, []);

  // Check if settings are complete
  const areSettingsComplete = useCallback(() => {
    return !!(
      state.providerSettings?.provider &&
      state.providerSettings?.ai_model &&
      state.providerSettings?.api_key
    );
  }, [state.providerSettings]);

  return {
    // State
    providerSettings: state.providerSettings,
    isProviderValid: state.isProviderValid,
    error: state.errors.provider,
    areSettingsComplete: areSettingsComplete(),

    // Actions
    updateProviderSettings,
    setProvider,
    setModel,
    setApiKey,
    testApiKey,
    validateCurrentSettings,
    getAvailableProviders,
  };
}; 