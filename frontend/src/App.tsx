import { useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from './components/Header'
import { PromptForm } from './components/PromptForm'
import { PromptResult } from './components/PromptResult'
import { ArchitectureSelector } from './components/ArchitectureSelector'
import { LoadingSpinner } from './components/LoadingSpinner'
import { usePromptImprovement } from './hooks/usePromptImprovement'
import { PromptArchitecture } from './types/api'

function App() {
  const [originalPrompt, setOriginalPrompt] = useState('')
  const [selectedArchitecture, setSelectedArchitecture] = useState<PromptArchitecture>('auto')
  const [context, setContext] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  
  const { 
    mutate: improvePrompt, 
    isLoading, 
    data: result, 
    error 
  } = usePromptImprovement()

  const handleSubmit = () => {
    if (!originalPrompt.trim()) return
    
    improvePrompt({
      original_prompt: originalPrompt,
      architecture: selectedArchitecture,
      context: context || undefined,
      target_audience: targetAudience || undefined,
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левая панель - ввод */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="card p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900">
                  Введите ваш промпт
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <ArchitectureSelector
                selected={selectedArchitecture}
                onSelect={setSelectedArchitecture}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <button
                onClick={handleSubmit}
                disabled={!originalPrompt.trim() || isLoading}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Улучшаем промпт...
                  </>
                ) : (
                  'Улучшить промпт'
                )}
              </button>
            </motion.div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-4 border-error-200 bg-error-50"
              >
                <p className="text-error-700 text-sm">
                  Ошибка: {error.message}
                </p>
              </motion.div>
            )}
          </div>

          {/* Правая панель - результат */}
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
                  Готов к улучшению
                </h3>
                <p className="text-gray-500">
                  Введите ваш промпт слева и нажмите "Улучшить промпт" для получения оптимизированной версии
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