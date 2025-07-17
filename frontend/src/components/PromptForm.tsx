import React from 'react'

interface PromptFormProps {
  prompt: string
  onPromptChange: (value: string) => void
  context: string
  onContextChange: (value: string) => void
  targetAudience: string
  onTargetAudienceChange: (value: string) => void
}

export const PromptForm: React.FC<PromptFormProps> = ({
  prompt,
  onPromptChange,
  context,
  onContextChange,
  targetAudience,
  onTargetAudienceChange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Исходный промпт *
        </label>
        <textarea
          id="prompt"
          className="textarea min-h-[120px]"
          placeholder="Введите ваш промпт для улучшения..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
          Дополнительный контекст
        </label>
        <textarea
          id="context"
          className="textarea min-h-[80px]"
          placeholder="Опишите контекст использования промпта (опционально)"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
          Целевая аудитория
        </label>
        <input
          id="audience"
          type="text"
          className="input"
          placeholder="Например: разработчики, маркетологи, студенты"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
        />
      </div>
    </div>
  )
} 