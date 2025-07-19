import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './components/Header'
import { PromptForm } from './components/PromptForm'
import { PromptResult } from './components/PromptResult'
import { ArchitectureSelector } from './components/ArchitectureSelector'
import { AIProviderSettings } from './components/AIProviderSettings'
import { MultiAgentInterface } from './components/MultiAgentInterface'
import { LoadingSpinner } from './components/LoadingSpinner'
import { usePromptImprovement } from './hooks/usePromptImprovement'
import type { PromptArchitecture, ProviderSettings, ConnectionTestResult } from './types/api'

type ImprovementMode = 'single' | 'multi' | 'enhanced-multi'

function App() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [selectedArchitecture, setSelectedArchitecture] = useState<PromptArchitecture>('auto')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [improvementMode, setImprovementMode] = useState<ImprovementMode>('single')
  
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

            {/* Improvement Mode Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="card p-6"
            >
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                🔄 Improvement Mode
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="text-2xl mb-2">🤖</div>
                  <div className="font-medium">Multi-Agent</div>
                  <div className="text-sm opacity-75 mt-1">
                    Basic AI team collaboration
                  </div>
                </motion.button>

                <motion.button
                  onClick={() => setImprovementMode('enhanced-multi')}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    improvementMode === 'enhanced-multi'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="font-medium">Enhanced Elite</div>
                  <div className="text-sm opacity-75 mt-1">
                    Elite team + 2025 techniques
                  </div>
                </motion.button>
              </div>
            </motion.div>

            {/* Prompt Form */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
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

            {/* Architecture Selector - Only for Single Agent Mode */}
            {improvementMode === 'single' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <ArchitectureSelector
                  selected={selectedArchitecture}
                  onSelect={setSelectedArchitecture}
                />
              </motion.div>
            )}

            {/* Submit Button - Only for Single Agent Mode */}
            {improvementMode === 'single' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
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
            )}

            {/* Multi-Agent Interface */}
            {(improvementMode === 'multi' || improvementMode === 'enhanced-multi') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <MultiAgentInterface
                  prompt={originalPrompt}
                  providerSettings={providerSettings}
                  onPromptChange={setOriginalPrompt}
                  isEnhanced={improvementMode === 'enhanced-multi'}
                />
              </motion.div>
            )}

            {/* Error Display - Only for Single Agent Mode */}
            {improvementMode === 'single' && error && (
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
            {/* Results for Single Agent Mode */}
            {improvementMode === 'single' && result ? (
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
            ) : improvementMode === 'single' ? (
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
            ) : (
              /* Multi-Agent Mode Info */
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="card p-8"
              >
                <div className="text-center mb-6">
                  <div className="text-4xl mb-4">
                    {improvementMode === 'enhanced-multi' ? '🚀' : '🤖'}
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">
                    {improvementMode === 'enhanced-multi' 
                      ? 'Enhanced Elite Multi-Agent System'
                      : 'Multi-Agent Collaboration'
                    }
                  </h3>
                  <p className="text-gray-600">
                    {improvementMode === 'enhanced-multi'
                      ? 'Elite prompt engineering team with cutting-edge 2025 techniques, advanced quality rules, and strategic decision making'
                      : 'Three specialized AI agents work together to improve your prompt through iterative collaboration'
                    }
                  </p>
                </div>

                <div className="space-y-4">
                  {improvementMode === 'enhanced-multi' ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-lg">🔧</span>
                        <div>
                          <div className="font-medium text-blue-800">Prompt Engineer</div>
                          <div className="text-sm text-blue-600">
                            Analyzes structure and applies advanced prompt engineering techniques
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <span className="text-lg">🔍</span>
                        <div>
                          <div className="font-medium text-green-800">Reviewer</div>
                          <div className="text-sm text-green-600">
                            Evaluates quality against best practices and provides feedback
                          </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                        <span className="text-lg">👔</span>
                        <div>
                          <div className="font-medium text-purple-800">Lead</div>
                          <div className="text-sm text-purple-600">
                            Makes final decisions on approval, rejection, or continuation
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-600">⚡</span>
                    <span className="font-medium text-yellow-800">How it works:</span>
                  </div>
                  <ol className="text-sm text-yellow-700 space-y-1 pl-4">
                    <li>1. Engineer improves the prompt</li>
                    <li>2. Reviewer evaluates and provides feedback</li>
                    <li>3. Lead decides: approve, reject, or continue</li>
                    <li>4. Process repeats until approval or max rounds</li>
                  </ol>
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