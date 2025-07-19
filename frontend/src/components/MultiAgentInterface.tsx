import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ProviderSettings } from '../types/api'
import { LoadingSpinner } from './LoadingSpinner'

interface MultiAgentInterfaceProps {
  prompt: string
  providerSettings: ProviderSettings
  onPromptChange: (prompt: string) => void
}

interface AgentUpdate {
  round: number
  current_prompt: string
  decision?: 'approve' | 'reject' | 'continue'
  feedback_history: Array<{
    round: number
    agent: string
    recommendation: string
    feedback: string
    prompt_reviewed: string
  }>
  is_final: boolean
}

interface AgentInfo {
  name: string
  role: string
  tools: string[]
}

const AGENT_INFO: AgentInfo[] = [
  {
    name: "Prompt Engineer",
    role: "Analyzes and rewrites prompts using advanced techniques",
    tools: ["analyze_prompt_structure", "get_prompt_engineering_techniques"]
  },
  {
    name: "Reviewer", 
    role: "Evaluates prompt quality against best practices",
    tools: ["evaluate_prompt_quality", "check_prompt_compliance"]
  },
  {
    name: "Lead",
    role: "Makes final decisions on approval/rejection",
    tools: ["analyze_improvement_progress", "make_final_decision"]
  }
]

export const MultiAgentInterface: React.FC<MultiAgentInterfaceProps> = ({
  prompt,
  providerSettings,
  onPromptChange
}) => {
  const [isRunning, setIsRunning] = useState(false)
  const [maxRounds, setMaxRounds] = useState(10)
  const [currentRound, setCurrentRound] = useState(0)
  const [agentUpdates, setAgentUpdates] = useState<AgentUpdate[]>([])
  const [finalResult, setFinalResult] = useState<any>(null)
  const [currentAgent, setCurrentAgent] = useState<string>('')
  const [error, setError] = useState<string>('')

  const startMultiAgentImprovement = async () => {
    if (!prompt.trim() || !providerSettings.api_key.trim()) {
      setError('Please provide a prompt and API key')
      return
    }

    setIsRunning(true)
    setError('')
    setAgentUpdates([])
    setFinalResult(null)
    setCurrentRound(0)
    setCurrentAgent('Prompt Engineer')

    try {
      const endpoint = 'http://localhost:8000/api/v1/multi-agent/improve-prompt-stream'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_prompt: prompt,
          provider_settings: providerSettings,
          max_rounds: maxRounds
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            
            if (data === '[DONE]') {
              setIsRunning(false)
              setCurrentAgent('')
              return
            }

            try {
              const update: AgentUpdate = JSON.parse(data)
              setCurrentRound(update.round)
              setAgentUpdates(prev => [...prev, update])
              
              // Update current agent based on round progression
              const agentIndex = (update.round - 1) % 3
              setCurrentAgent(AGENT_INFO[agentIndex].name)
              
              if (update.is_final) {
                setFinalResult(update)
                setIsRunning(false)
                setCurrentAgent('')
                
                // Update the parent prompt if approved
                if (update.decision === 'approve' && update.current_prompt) {
                  onPromptChange(update.current_prompt)
                }
              }
            } catch (e) {
              console.error('Error parsing update:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Multi-agent error:', error)
      setError(error instanceof Error ? error.message : 'Unknown error occurred')
      setIsRunning(false)
      setCurrentAgent('')
    }
  }

  const getAgentIcon = (agentName: string) => {
    switch (agentName) {
      case 'Prompt Engineer': return '🔧'
      case 'Reviewer': return '🔍' 
      case 'Lead': return '👔'
      default: return '🤖'
    }
  }

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approve': return 'text-green-600 bg-green-50'
      case 'reject': return 'text-red-600 bg-red-50'
      case 'continue': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6"
    >
      <h2 className="text-xl font-semibold mb-4 text-gray-900">
        🚀 Multi-Agent Elite System
      </h2>

      {/* Prompt Input */}
      <div className="mb-6">
        <label htmlFor="multiAgentPrompt" className="block text-sm font-medium text-gray-700 mb-2">
          Prompt to Improve *
        </label>
        <textarea
          id="multiAgentPrompt"
          className="textarea min-h-[120px]"
          placeholder="Enter your prompt for multi-agent improvement..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          disabled={isRunning}
        />
        <p className="text-xs text-gray-500 mt-1">
          The elite team will analyze and improve this prompt through collaborative iteration
        </p>
      </div>

      {/* Agent Information */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Elite Team Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {AGENT_INFO.map((agent, index) => (
            <div
              key={agent.name}
              className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                currentAgent === agent.name
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{getAgentIcon(agent.name)}</span>
                <span className="font-medium text-sm">{agent.name}</span>
                {currentAgent === agent.name && isRunning && (
                  <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                )}
              </div>
              <p className="text-xs text-gray-600">{agent.role}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label htmlFor="maxRounds" className="text-sm font-medium text-gray-700">
            Max Rounds:
          </label>
          <select
            id="maxRounds"
            value={maxRounds}
            onChange={(e) => setMaxRounds(parseInt(e.target.value))}
            disabled={isRunning}
            className="input w-20"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <button
          onClick={startMultiAgentImprovement}
          disabled={isRunning || !prompt.trim() || !providerSettings.api_key.trim()}
          className="btn btn-primary flex items-center gap-2"
        >
          {isRunning ? (
            <>
              <LoadingSpinner size="sm" />
              Round {currentRound}/{maxRounds}
            </>
          ) : (
            'Start Elite Team Improvement'
          )}
        </button>
        
        {(!prompt.trim() || !providerSettings.api_key.trim()) && !isRunning && (
          <p className="text-sm text-gray-500 mt-2">
            {!prompt.trim() ? 'Please enter a prompt to improve' : 'Please configure API key in Provider Settings'}
          </p>
        )}
      </div>

      {/* Current Status */}
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="font-medium text-blue-800">
              Round {currentRound}/{maxRounds} - {currentAgent} working...
            </span>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
        >
          <p className="text-red-700">❌ {error}</p>
        </motion.div>
      )}

      {/* Progress Updates */}
      <AnimatePresence>
        {agentUpdates.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <h3 className="text-lg font-medium text-gray-800">
              Collaboration Progress
            </h3>
            
            <div className="max-h-96 overflow-y-auto space-y-3">
              {agentUpdates.map((update, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 rounded-lg p-4 bg-white"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">
                      Round {update.round}
                    </span>
                    {update.decision && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDecisionColor(update.decision)}`}>
                        {update.decision.toUpperCase()}
                      </span>
                    )}
                  </div>
                  
                  {/* Show latest feedback */}
                  {update.feedback_history.length > 0 && (
                    <div className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">
                        {getAgentIcon(update.feedback_history[update.feedback_history.length - 1].agent)} 
                        {update.feedback_history[update.feedback_history.length - 1].agent}:
                      </span>
                      <span className="ml-2">
                        {update.feedback_history[update.feedback_history.length - 1].recommendation}
                      </span>
                    </div>
                  )}
                  
                  {/* Show current prompt if different from original */}
                  {update.current_prompt && update.current_prompt !== prompt && (
                    <div className="mt-2 p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                      <p className="text-sm font-medium text-gray-700 mb-1">Current Prompt:</p>
                      <p className="text-sm text-gray-600">{update.current_prompt}</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Result */}
      {finalResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🎉 Multi-Agent Process Complete!
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{finalResult.round}</div>
              <div className="text-sm text-gray-600">Rounds Completed</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getDecisionColor(finalResult.decision).split(' ')[0]}`}>
                {finalResult.decision?.toUpperCase()}
              </div>
              <div className="text-sm text-gray-600">Final Decision</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{finalResult.feedback_history?.length || 0}</div>
              <div className="text-sm text-gray-600">Agent Interactions</div>
            </div>
          </div>

          {finalResult.decision === 'approve' && (
            <div className="p-4 bg-white rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-700 mb-2">✅ Improved Prompt Approved:</p>
              <p className="text-sm text-gray-700">{finalResult.current_prompt}</p>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  )
} 