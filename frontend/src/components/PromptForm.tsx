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
          Original Prompt *
        </label>
        <textarea
          id="prompt"
          className="textarea min-h-[120px]"
          placeholder="Enter your prompt for improvement..."
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Context
        </label>
        <textarea
          id="context"
          className="textarea min-h-[80px]"
          placeholder="Describe the context of prompt usage (optional)"
          value={context}
          onChange={(e) => onContextChange(e.target.value)}
        />
      </div>

      <div>
        <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-2">
          Target Audience
        </label>
        <input
          id="audience"
          type="text"
          className="input"
          placeholder="Specify the target audience (optional)"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
        />
      </div>
    </div>
  )
} 