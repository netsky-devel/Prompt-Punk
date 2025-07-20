import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './components/Header'
import { AsyncTaskInterface } from './components/AsyncTaskInterface'
import type { ProviderSettings, ConnectionTestResult } from './types/api'

function App() {
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>({
    provider: 'google',
    model_name: 'gemini-1.5-pro',
    api_key: '',
    temperature: 0.7,
    max_tokens: 2000
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interface */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card mb-6 overflow-hidden"
            >
              <div className="card-header gradient-bg">
                <div className="section-header">
                  <span className="emoji">🔥</span>
                  <span className="gradient-text">Async Prompt Improvement</span>
                </div>
                <p className="text-gray-600 text-lg leading-relaxed">
                  Professional prompt improvement with no timeouts, full progress tracking, and support for both single agent and multi-agent processing.
                </p>
              </div>
              
              <div className="card-content">
                {/* Provider Settings */}
                <div className="provider-settings">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-xl">⚙️</span>
                    Provider Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        🤖 Provider
                      </label>
                      <select
                        value={providerSettings.provider}
                        onChange={(e) => setProviderSettings(prev => ({ 
                          ...prev, 
                          provider: e.target.value as any 
                        }))}
                        className="input"
                      >
                        <option value="google">🧠 Google (Gemini)</option>
                        <option value="openai">⚡ OpenAI (GPT)</option>
                        <option value="anthropic">🎭 Anthropic (Claude)</option>
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        🎯 Model
                      </label>
                      <input
                        type="text"
                        value={providerSettings.model_name}
                        onChange={(e) => setProviderSettings(prev => ({ 
                          ...prev, 
                          model_name: e.target.value 
                        }))}
                        className="input"
                        placeholder="gemini-1.5-pro"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-gray-700">
                        🔑 API Key
                      </label>
                      <input
                        type="password"
                        value={providerSettings.api_key}
                        onChange={(e) => setProviderSettings(prev => ({ 
                          ...prev, 
                          api_key: e.target.value 
                        }))}
                        className="input"
                        placeholder="Your API key..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Async Task Interface */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <AsyncTaskInterface
                apiKey={providerSettings.api_key}
                modelName={providerSettings.model_name}
              />
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App 