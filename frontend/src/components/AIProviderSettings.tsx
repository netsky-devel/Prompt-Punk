import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { AIProvider, ProviderSettings, ProviderModel, ConnectionTestResult } from '../types/api'
import { LoadingSpinner } from './LoadingSpinner'

interface AIProviderSettingsProps {
  settings: ProviderSettings
  onSettingsChange: (settings: ProviderSettings) => void
  onTestConnection?: (result: ConnectionTestResult) => void
}

const PROVIDER_INFO: Record<AIProvider, {
  name: string
  icon: string
  keyPlaceholder: string
  keyHelp: string
}> = {
  google: {
    name: 'Google Gemini',
    icon: '🧠',
    keyPlaceholder: 'Your Google API Key',
    keyHelp: 'Get your API key at: https://makersuite.google.com/app/apikey'
  },
  openai: {
    name: 'OpenAI GPT',
    icon: '🤖',
    keyPlaceholder: 'Your OpenAI API Key (sk-...)',
    keyHelp: 'Get your API key at: https://platform.openai.com/api-keys'
  },
  anthropic: {
    name: 'Anthropic Claude',
    icon: '🎭',
    keyPlaceholder: 'Your Anthropic API Key',
    keyHelp: 'Get your API key at: https://console.anthropic.com/'
  }
}

export const AIProviderSettings: React.FC<AIProviderSettingsProps> = ({
  settings,
  onSettingsChange,
  onTestConnection
}) => {
  const [availableProviders, setAvailableProviders] = useState<ProviderModel[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [showApiKey, setShowApiKey] = useState(false)

  // Load available providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('http://localhost:8000/api/v1/providers')
        const data = await response.json()
        setAvailableProviders(data.providers)
      } catch (error) {
        console.error('Failed to fetch providers:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProviders()
  }, [])

  const currentProvider = availableProviders.find(p => p.provider === settings.provider)

  const handleProviderChange = (provider: AIProvider) => {
    const providerData = availableProviders.find(p => p.provider === provider)
    if (providerData) {
      onSettingsChange({
        ...settings,
        provider,
        model_name: providerData.default_model
      })
    }
    setConnectionStatus('idle')
  }

  const handleModelChange = (model_name: string) => {
    onSettingsChange({
      ...settings,
      model_name
    })
    setConnectionStatus('idle')
  }

  const handleApiKeyChange = (api_key: string) => {
    onSettingsChange({
      ...settings,
      api_key
    })
    setConnectionStatus('idle')
  }

  const handleAdvancedSettingChange = (field: 'temperature' | 'max_tokens', value: number | undefined) => {
    onSettingsChange({
      ...settings,
      [field]: value
    })
  }

  const testConnection = async () => {
    if (!settings.api_key) return

    try {
      setIsTestingConnection(true)
      setConnectionStatus('idle')

      const response = await fetch('http://localhost:8000/api/v1/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings)
      })

      const result: ConnectionTestResult = await response.json()
      
      setConnectionStatus(result.connected ? 'success' : 'error')
      onTestConnection?.(result)
    } catch (error) {
      setConnectionStatus('error')
      console.error('Connection test failed:', error)
    } finally {
      setIsTestingConnection(false)
    }
  }

  if (isLoading) {
    return (
      <div className="card p-6 text-center">
        <LoadingSpinner />
        <p className="text-gray-600 mt-2">Loading providers...</p>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        🤖 AI Provider Settings
      </h2>

      {/* Provider Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AI Provider
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableProviders.map((provider) => {
              const info = PROVIDER_INFO[provider.provider]
              const isSelected = settings.provider === provider.provider
              
              return (
                <motion.button
                  key={provider.provider}
                  onClick={() => handleProviderChange(provider.provider)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-1">{info.icon}</div>
                  <div className="font-medium">{info.name}</div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* Model Selection */}
        {currentProvider && (
          <div>
            <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <select
              id="model"
              value={settings.model_name}
              onChange={(e) => handleModelChange(e.target.value)}
              className="input"
            >
              {currentProvider.models.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* API Key */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700 mb-2">
            API Key
          </label>
          <div className="relative">
            <input
              id="apiKey"
              type={showApiKey ? 'text' : 'password'}
              value={settings.api_key}
              onChange={(e) => handleApiKeyChange(e.target.value)}
              placeholder={PROVIDER_INFO[settings.provider]?.keyPlaceholder}
              className="input pr-20"
            />
            <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-gray-400 hover:text-gray-600"
              >
                {showApiKey ? '🙈' : '👁️'}
              </button>
              {settings.api_key && (
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={isTestingConnection}
                  className={`text-sm px-2 py-1 rounded ${
                    connectionStatus === 'success'
                      ? 'text-green-600'
                      : connectionStatus === 'error'
                      ? 'text-red-600'
                      : 'text-blue-600 hover:text-blue-700'
                  }`}
                >
                  {isTestingConnection ? (
                    <LoadingSpinner size="sm" />
                  ) : connectionStatus === 'success' ? (
                    '✅'
                  ) : connectionStatus === 'error' ? (
                    '❌'
                  ) : (
                    'Test'
                  )}
                </button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {PROVIDER_INFO[settings.provider]?.keyHelp}
          </p>
        </div>

        {/* Advanced Settings */}
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
            ⚙️ Advanced Settings
          </summary>
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-gray-100">
            <div>
              <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 mb-1">
                Temperature: {settings.temperature ?? 0.7}
              </label>
              <input
                id="temperature"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature ?? 0.7}
                onChange={(e) => handleAdvancedSettingChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Focused (0)</span>
                <span>Balanced (1)</span>
                <span>Creative (2)</span>
              </div>
            </div>

            <div>
              <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 mb-1">
                Max Tokens (optional)
              </label>
              <input
                id="maxTokens"
                type="number"
                min="1"
                max="32000"
                value={settings.max_tokens ?? ''}
                onChange={(e) => handleAdvancedSettingChange('max_tokens', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Leave empty for default"
                className="input"
              />
            </div>
          </div>
        </details>
      </div>
    </motion.div>
  )
} 