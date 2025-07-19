import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './components/Header'
import { PromptForm } from './components/PromptForm'
import { PromptResult } from './components/PromptResult'
import { ArchitectureSelector } from './components/ArchitectureSelector'
import { LoadingSpinner } from './components/LoadingSpinner'
import { MultiAgentInterface } from './components/MultiAgentInterface'
import { usePromptImprovement } from './hooks/usePromptImprovement'
import type { PromptArchitecture, ProviderSettings, ConnectionTestResult } from './types/api'

type ImprovementMode = 'single' | 'multi'

function App() {
  const [improvementMode, setImprovementMode] = useState<ImprovementMode>('multi')
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [selectedArchitecture, setSelectedArchitecture] = useState<PromptArchitecture>('auto')
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    provider: 'google',
    model_name: 'gemini-pro',
    api_key: '',
    temperature: 0.7,
    max_tokens: 2000
  })

  const { 
    mutate: improvePrompt, 
    isLoading, 
    data: result, 
    error 
  } = usePromptImprovement()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!originalPrompt.trim()) {
      return
    }

    if (!providerSettings.api_key) {
      alert('Please enter your API key in the provider settings')
      return
    }

    improvePrompt({
      original_prompt: originalPrompt,
      context,
      target_audience: targetAudience,
      architecture: selectedArchitecture,
      provider_settings: providerSettings
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Improvement Mode Selection */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                <span className="mr-2">🎯</span>
                Improvement Mode
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.button
                  onClick={() => setImprovementMode('single')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    improvementMode === 'single'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2">⚡</div>
                  <div className="font-medium">Single Agent</div>
                  <div className="text-sm opacity-75 mt-1">
                    Fast, direct improvement
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setImprovementMode('multi')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    improvementMode === 'multi'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium">Multi-Agent Elite</div>
                  <div className="text-sm opacity-75 mt-1">
                    Advanced AI team with 2025 techniques
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Provider Settings */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🔧</span>
                  Provider Settings
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Provider
                  </label>
                  <select
                    value={providerSettings.provider}
                    onChange={(e) => setProviderSettings(prev => ({ 
                      ...prev, 
                      provider: e.target.value as any 
                    }))}
                    className="input"
                  >
                    <option value="google">Google (Gemini)</option>
                    <option value="openai">OpenAI (GPT)</option>
                    <option value="anthropic">Anthropic (Claude)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={providerSettings.model_name}
                    onChange={(e) => setProviderSettings(prev => ({ 
                      ...prev, 
                      model_name: e.target.value 
                    }))}
                    className="input"
                    placeholder="gemini-pro"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={providerSettings.temperature}
                    onChange={(e) => setProviderSettings(prev => ({ 
                      ...prev, 
                      temperature: parseFloat(e.target.value) 
                    }))}
                    className="input"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API Key
                </label>
                                 <input
                   type="password"
                   value={providerSettings.api_key}
                   onChange={(e) => setProviderSettings(prev => ({ 
                     ...prev, 
                     api_key: e.target.value 
                   }))}
                   className="input"
                   placeholder="Enter your API key..."
                 />
              </div>
            </motion.div>

            {/* Prompt Input Form */}
            {improvementMode === 'single' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="card p-6"
              >
                <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                  <span className="mr-2">✏️</span>
                  Prompt Details
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <PromptForm
                    prompt={originalPrompt}
                    onPromptChange={setOriginalPrompt}
                    context={context}
                    onContextChange={setContext}
                    targetAudience={targetAudience}
                    onTargetAudienceChange={setTargetAudience}
                  />
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      type="submit"
                      disabled={isLoading || !originalPrompt.trim() || !providerSettings.api_key}
                      className="btn btn-primary w-full"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <LoadingSpinner size="sm" />
                          <span className="ml-2">Improving prompt...</span>
                        </div>
                      ) : (
                        'Improve Prompt'
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Multi-Agent Interface */}
            {improvementMode === 'multi' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <MultiAgentInterface
                  prompt={originalPrompt}
                  providerSettings={providerSettings}
                  onPromptChange={setOriginalPrompt}
                />
              </motion.div>
            )}

            {/* Results */}
            <AnimatePresence>
              {result && improvementMode === 'single' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <PromptResult
                    originalPrompt={originalPrompt}
                    result={result}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error Display */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="card p-6 border border-error-200 bg-error-50"
                >
                  <h3 className="text-lg font-semibold text-error-800 mb-2">
                    Error
                  </h3>
                                     <p className="text-error-700">{error?.detail || String(error)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column - Info */}
          <div className="space-y-6">
            {improvementMode === 'single' ? (
              /* Single Agent Mode Info */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-6"
              >
                <ArchitectureSelector
                  selected={selectedArchitecture}
                  onSelect={setSelectedArchitecture}
                />
              </motion.div>
            ) : (
              /* Multi-Agent Mode Info */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-8"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">🚀</div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    Multi-Agent Elite System
                  </h3>
                  <p className="text-gray-600">
                    Advanced prompt engineering team with cutting-edge 2025 techniques, quality rules, and strategic decision making
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-lg">🧠</span>
                    <div>
                      <div className="font-medium text-blue-800">Master Prompt Engineer</div>
                      <div className="text-sm text-blue-600">
                        Advanced analysis with 2025 cutting-edge techniques (EmotionPrompting, Meta-cognitive Elements)
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <span className="text-lg">📊</span>
                    <div>
                      <div className="font-medium text-green-800">Elite Quality Reviewer</div>
                      <div className="text-sm text-green-600">
                        100-point scoring system with strict compliance rules and detailed evaluation criteria
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                    <span className="text-lg">🎯</span>
                    <div>
                      <div className="font-medium text-purple-800">Strategic Lead</div>
                      <div className="text-sm text-purple-600">
                        Data-driven decisions with violation tracking, progress metrics, and efficiency optimization
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <h4 className="font-medium text-gray-800 mb-2">Enhanced Features</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Uses excellent system prompt from docs/</li>
                    <li>• EmotionPrompting (115%+ improvement)</li>
                    <li>• Multi-Token Prediction & Curiosity Gap</li>
                    <li>• Implementation Intentions & Meta-cognitive</li>
                    <li>• Advanced quality rules enforcement</li>
                    <li>• Strategic decision making up to 10 rounds</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 