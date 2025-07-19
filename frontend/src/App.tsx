import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './components/Header'
import { PromptForm } from './components/PromptForm'
import { PromptResult } from './components/PromptResult'
import { ArchitectureSelector } from './components/ArchitectureSelector'
import { AIProviderSettings } from './components/AIProviderSettings'
import { LoadingSpinner } from './components/LoadingSpinner'
import { usePromptImprovement } from './hooks/usePromptImprovement'
import type { PromptArchitecture, ProviderSettings, ConnectionTestResult } from './types/api'

function App() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [selectedArchitecture, setSelectedArchitecture] = useState<PromptArchitecture>('auto')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  
  // AI Provider settings state
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    provider: 'google',
    model_name: 'gemini-1.5-pro-latest',
    api_key: '',
    temperature: 0.7,
    max_tokens: undefined
  })
  
  const { 
    mutate: improvePrompt, 
    isLoading, 
    data: result, 
    error 
  } = usePromptImprovement()

  const handleSubmit = () => {
    if (!originalPrompt.trim() || !providerSettings.api_key.trim()) return
    
    improvePrompt({
      original_prompt: originalPrompt,
      provider_settings: providerSettings,
      architecture: selectedArchitecture,
      context: context || undefined,
      target_audience: targetAudience || undefined,
    })
  }

  const handleConnectionTest = (result: ConnectionTestResult) => {
    if (result.connected) {
      console.log(`✅ Connected to ${result.provider} ${result.model}`)
    } else {
      console.error(`❌ Failed to connect to ${result.provider} ${result.model}`)
    }
  }

  const isReadyToSubmit = originalPrompt.trim() && providerSettings.api_key.trim()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left panel - input */}
          <div className="space-y-6">
            {/* AI Provider Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <AIProviderSettings
                settings={providerSettings}
                onSettingsChange={setProviderSettings}
                onTestConnection={handleConnectionTest}
              />
            </motion.div>

            {/* Prompt Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Enter Your Prompt
                </h2>
                
                <PromptForm
                  prompt={originalPrompt}
                  onPromptChange={setOriginalPrompt}
                  context={context}
                  onContextChange={setContext}
                  targetAudience={targetAudience}
                  onTargetAudienceChange={setTargetAudience}
                />
              </div>
            </motion.div>

            {/* Architecture Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <ArchitectureSelector
                selected={selectedArchitecture}
                onSelect={setSelectedArchitecture}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!isReadyToSubmit || isLoading}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Improving prompt...
                  </>
                ) : (
                  'Improve Prompt'
                )}
              </button>
              
              {!providerSettings.api_key.trim() && (
                <p className="text-sm text-gray-500 mt-2 text-center">
                  Please enter your API key in the provider settings above
                </p>
              )}
            </motion.div>

            {/* Error Display */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-4 border-error-200 bg-error-50"
              >
                <p className="text-error-700 text-sm">
                  Error: {error.detail}
                </p>
              </motion.div>
            )}
          </div>

          {/* Right panel - result */}
          <div className="space-y-6">
            {result ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <PromptResult
                  originalPrompt={originalPrompt}
                  result={result}
                />
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-8 text-center"
              >
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  Ready to Improve
                </h3>
                <p className="text-gray-500">
                  Configure your AI provider, enter your prompt on the left, and click "Improve Prompt" to get an optimized version
                </p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 