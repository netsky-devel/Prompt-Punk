import { useState } from 'react';
import { Key, AlertCircle, CheckCircle } from 'lucide-react';
import { apiClient } from '../services/api';

interface ApiKeySetupProps {
  onApiKeySubmit: (apiKey: string) => void;
  initialApiKey?: string;
}

export function ApiKeySetup({ onApiKeySubmit, initialApiKey = '' }: ApiKeySetupProps) {
  const [apiKey, setApiKey] = useState(initialApiKey);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      setError('Please enter your API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      // Set API key for the client
      apiClient.setApiKey(apiKey.trim());
      
      // Test the API key
      const response = await apiClient.testApiKey();
      
      if (response.success && response.data?.valid === true) {
        // API key is valid, submit it
        onApiKeySubmit(apiKey.trim());
      } else {
        setError(response.error || 'Invalid API key');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to validate API key';
      setError(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-8">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mx-auto mb-4">
          <Key className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to Prompt Punk
        </h2>
        <p className="text-dark-400">
          Enter your AI provider API key to get started
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-dark-300 mb-2">
            API Key
          </label>
          <input
            type="password"
            id="apiKey"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Gemini API key..."
            className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled={isValidating}
          />
        </div>

        {error && (
          <div className="flex items-center space-x-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isValidating || !apiKey.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isValidating ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Validating...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span>Continue</span>
            </div>
          )}
        </button>
      </form>

      <div className="mt-8 p-4 bg-dark-800 rounded-lg">
        <h3 className="text-sm font-medium text-dark-300 mb-2">
          Supported Providers
        </h3>
        <div className="flex items-center space-x-4 text-xs text-dark-400">
          <span className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Google Gemini</span>
          </span>
        </div>
      </div>
    </div>
  );
}
