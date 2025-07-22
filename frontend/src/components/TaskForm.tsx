import React, { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface TaskFormProps {
  onTaskSubmitted: (taskData: {
    original_prompt: string;
    provider: string;
    architecture: string;
    max_rounds: number;
  }) => Promise<void>;
  onError: (error: string) => void;
  isSubmitting: boolean;
}

export const TaskForm: React.FC<TaskFormProps> = ({ 
  onTaskSubmitted, 
  onError,
  isSubmitting 
}) => {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('google');
  const [architecture, setArchitecture] = useState('chain_of_thought');
  const [maxRounds, setMaxRounds] = useState(3);

  const submitTask = async () => {
    if (!prompt.trim()) {
      onError('Please enter a prompt to improve');
      return;
    }

    try {
      // Call onTaskSubmitted with form data for parent component to handle API call
      await onTaskSubmitted({
        original_prompt: prompt,
        provider: provider,
        architecture: architecture,
        max_rounds: maxRounds
      });
      
      // Clear form after successful submission
      setPrompt('');
    } catch (error) {
      console.error('Error submitting task:', error);
      onError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Multi-Agent Prompt Improvement</h2>
      
      <div className="space-y-6">
        {/* Prompt Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Original Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px] resize-y"
            placeholder="Enter your prompt here..."
            disabled={isSubmitting}
          />
        </div>

        {/* Settings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="google">Google Gemini</option>
              <option value="openai">OpenAI GPT</option>
              <option value="anthropic">Anthropic Claude</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Architecture
            </label>
            <select
              value={architecture}
              onChange={(e) => setArchitecture(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            >
              <option value="chain_of_thought">Chain of Thought</option>
              <option value="meta_cognitive">Meta-Cognitive</option>
              <option value="five_tier_framework">5-Tier Framework</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Rounds
            </label>
            <input
              type="number"
              value={maxRounds}
              onChange={(e) => setMaxRounds(parseInt(e.target.value) || 3)}
              min="1"
              max="10"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div>
          <button
            onClick={submitTask}
            disabled={isSubmitting || !prompt.trim()}
            className="btn btn-primary w-full"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                <span className="ml-2">Submitting...</span>
              </>
            ) : (
              '🚀 Improve Prompt'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
