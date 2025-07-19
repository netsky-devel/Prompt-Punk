import React from 'react'
import { PromptArchitecture } from '../types/api'

interface ArchitectureSelectorProps {
  selected: PromptArchitecture
  onSelect: (architecture: PromptArchitecture) => void
}

const architectures = [
  {
    id: 'auto' as PromptArchitecture,
    name: 'Auto Select',
    description: 'AI will automatically choose the best architecture',
    icon: '🎯'
  },
  {
    id: '5_tier' as PromptArchitecture,
    name: '5-Tier Framework',
    description: 'Role → Task → Context → Examples → Reminders',
    icon: '🏗️'
  },
  {
    id: 'chain_of_thought' as PromptArchitecture,
    name: 'Chain-of-Thought',
    description: 'Step-by-step reasoning for complex tasks',
    icon: '🔗'
  },
  {
    id: 'zero_shot' as PromptArchitecture,
    name: 'Zero-shot',
    description: 'No examples, instructions only',
    icon: '⚡'
  },
  {
    id: 'few_shot' as PromptArchitecture,
    name: 'Few-shot',
    description: 'With examples for better understanding',
    icon: '📚'
  },
  {
    id: 'emotional' as PromptArchitecture,
    name: 'EmotionPrompting',
    description: 'Emotional triggers to improve performance',
    icon: '💡'
  },
  {
    id: 'structured' as PromptArchitecture,
    name: 'Structured',
    description: 'Clear structure and formatting',
    icon: '📋'
  }
]

export const ArchitectureSelector: React.FC<ArchitectureSelectorProps> = ({
  selected,
  onSelect,
}) => {
  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Prompt Architecture
      </h3>
      
      <div className="grid grid-cols-1 gap-3">
        {architectures.map((arch) => (
          <label key={arch.id} className="cursor-pointer">
            <input
              type="radio"
              name="architecture"
              value={arch.id}
              checked={selected === arch.id}
              onChange={() => onSelect(arch.id)}
              className="sr-only"
            />
            <div
              className={`p-4 rounded-lg border-2 transition-all ${
                selected === arch.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-3">
                <span className="text-2xl">{arch.icon}</span>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{arch.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{arch.description}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 transition-colors ${
                    selected === arch.id
                      ? 'border-primary-500 bg-primary-500'
                      : 'border-gray-300'
                  }`}
                >
                  {selected === arch.id && (
                    <div className="w-full h-full rounded-full bg-white scale-[0.4]" />
                  )}
                </div>
              </div>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
} 