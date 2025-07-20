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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interface */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="card p-6 mb-6"
            >
              <h2 className="text-lg font-semibold mb-4 text-gray-900 flex items-center">
                <span className="mr-2">🔥</span>
                Async Prompt Improvement
              </h2>
              <p className="text-gray-600 mb-4">
                Professional prompt improvement with no timeouts, full progress tracking, and support for both single agent and multi-agent processing.
              </p>
              
              {/* Provider Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
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
                    placeholder="gemini-1.5-pro"
                  />
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
                    placeholder="Your API key..."
                  />
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