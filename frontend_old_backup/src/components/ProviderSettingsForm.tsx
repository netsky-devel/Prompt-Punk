import React from 'react';
import { useProvider } from '../hooks/useProvider';

export const ProviderSettingsForm: React.FC = () => {
  const {
    providerSettings,
    isProviderValid,
    error,
    areSettingsComplete,
    setProvider,
    setModel,
    setApiKey,
    testApiKey,
    getAvailableProviders,
  } = useProvider();

  const providers = getAvailableProviders();

  const handleTestApiKey = async () => {
    await testApiKey();
  };

  if (!providerSettings) {
    return null;
  }

  return (
    <div className="card overflow-hidden">
      <div className="card-header gradient-bg">
        <div className="section-header">
          <span className="emoji">⚙️</span>
          <span className="gradient-text">Provider Configuration</span>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed">
          Configure your AI provider settings to start improving prompts.
        </p>
      </div>
      
      <div className="card-content">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Provider Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              🤖 Provider
            </label>
            <select
              value={providerSettings.provider}
              onChange={(e) => setProvider(e.target.value as any)}
              className="input"
            >
              {providers.map((provider) => (
                <option key={provider.value} value={provider.value}>
                  {provider.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Model Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              🎯 Model
            </label>
            <input
              type="text"
              value={providerSettings.ai_model}
              onChange={(e) => setModel(e.target.value)}
              className="input"
              placeholder={`Default: ${providers.find(p => p.value === providerSettings.provider)?.defaultModel}`}
            />
          </div>
          
          {/* API Key */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              🔑 API Key
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={providerSettings.api_key}
                onChange={(e) => setApiKey(e.target.value)}
                className="input flex-1"
                placeholder="Your API key..."
              />
              {areSettingsComplete && (
                <button
                  onClick={handleTestApiKey}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isProviderValid
                      ? 'bg-green-100 text-green-700 border border-green-300'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isProviderValid ? '✓ Valid' : 'Test'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Success Display */}
        {isProviderValid && areSettingsComplete && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 text-sm">
              ✅ Provider settings validated successfully! You can now create tasks.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}; 