import React, { useState } from 'react'
import { PromptResponse } from '../types/api'

interface PromptResultProps {
  originalPrompt: string
  result: PromptResponse
}

export const PromptResult: React.FC<PromptResultProps> = ({
  originalPrompt,
  result,
}) => {
  const [activeTab, setActiveTab] = useState<'improved' | 'analysis' | 'comparison'>('improved')
  const [copiedText, setCopiedText] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedText(label)
    setTimeout(() => setCopiedText(null), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="card">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'improved', label: 'Улучшенный промпт', icon: '✨' },
              { id: 'analysis', label: 'Анализ', icon: '🔍' },
              { id: 'comparison', label: 'Сравнение', icon: '⚖️' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Улучшенный промпт */}
          {activeTab === 'improved' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Улучшенный промпт
                </h3>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    result.improvements.quality_score >= 80
                      ? 'bg-success-100 text-success-800'
                      : result.improvements.quality_score >= 60
                      ? 'bg-warning-100 text-warning-800'
                      : 'bg-error-100 text-error-800'
                  }`}>
                    Качество: {result.improvements.quality_score}/100
                  </span>
                  <button
                    onClick={() => copyToClipboard(result.improved_prompt, 'improved')}
                    className="btn btn-sm btn-secondary"
                  >
                    {copiedText === 'improved' ? '✓ Скопировано' : '📋 Копировать'}
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 border">
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                  {result.improved_prompt}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Архитектура:</span>
                  <span className="ml-2 text-gray-600">
                    {result.architecture_used === '5_tier' ? '5-уровневый фреймворк' :
                     result.architecture_used === 'chain_of_thought' ? 'Chain-of-Thought' :
                     result.architecture_used === 'emotional' ? 'EmotionPrompting' :
                     result.architecture_used}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Техник применено:</span>
                  <span className="ml-2 text-gray-600">
                    {result.improvements.applied_techniques.length}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Анализ */}
          {activeTab === 'analysis' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Основная цель</h4>
                <p className="text-gray-700">{result.analysis.main_goal}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Выявленные проблемы</h4>
                <ul className="space-y-2">
                  {result.analysis.identified_problems.map((problem, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-error-500 mr-2">•</span>
                      <span className="text-gray-700">{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Недостающие элементы</h4>
                <ul className="space-y-2">
                  {result.analysis.missing_elements.map((element, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-warning-500 mr-2">•</span>
                      <span className="text-gray-700">{element}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Потенциал улучшения</h4>
                <p className="text-gray-700">{result.analysis.improvement_potential}</p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Применённые техники</h4>
                <div className="space-y-3">
                  {result.improvements.applied_techniques.map((technique, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-1">{technique.name}</h5>
                      <p className="text-sm text-gray-600 mb-2">{technique.description}</p>
                      <p className="text-sm text-success-600">
                        <span className="font-medium">Эффект:</span> {technique.expected_effect}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ожидаемые результаты</h4>
                <ul className="space-y-2">
                  {result.improvements.expected_results.map((result, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-success-500 mr-2">✓</span>
                      <span className="text-gray-700">{result}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Сравнение */}
          {activeTab === 'comparison' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Исходный промпт</h4>
                  <button
                    onClick={() => copyToClipboard(originalPrompt, 'original')}
                    className="btn btn-sm btn-secondary"
                  >
                    {copiedText === 'original' ? '✓' : '📋'}
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {originalPrompt}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Символов: {originalPrompt.length}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">Улучшенный промпт</h4>
                  <button
                    onClick={() => copyToClipboard(result.improved_prompt, 'improved-comp')}
                    className="btn btn-sm btn-secondary"
                  >
                    {copiedText === 'improved-comp' ? '✓' : '📋'}
                  </button>
                </div>
                <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                    {result.improved_prompt}
                  </pre>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Символов: {result.improved_prompt.length} (+{result.improved_prompt.length - originalPrompt.length})
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 