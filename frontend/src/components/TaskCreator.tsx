import { useState } from 'react';
import { Send, Sparkles, Users, Settings } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { Task, CreateTaskRequest } from '../types/api';

interface TaskCreatorProps {
  onTaskCreated: (task: Task) => void;
}

export function TaskCreator({ onTaskCreated }: TaskCreatorProps) {
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('google');
  const [model, setModel] = useState('gemini-1.5-pro');
  const [maxRounds, setMaxRounds] = useState(3);
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const { createTask, isLoading, error, clearError } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      return;
    }

    const request: CreateTaskRequest = {
      task: {
        original_prompt: prompt.trim(),
        provider,
        ai_model: model,
        improvement_type: 'multi_agent',
        max_rounds: maxRounds,
        ...(context.trim() && { context: context.trim() }),
        ...(targetAudience.trim() && { target_audience: targetAudience.trim() }),
      }
    };

    const task = await createTask(request);
    if (task) {
      onTaskCreated(task);
      // Reset form
      setPrompt('');
      setContext('');
      setTargetAudience('');
    }
  };

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-8">
      <div className="flex items-center space-x-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Create New Task
          </h2>
          <p className="text-dark-400 text-sm">
            Improve your prompt with AI-powered multi-agent collaboration
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Main Prompt */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-dark-300 mb-2">
            Original Prompt *
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter the prompt you want to improve..."
            rows={4}
            className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled={isLoading}
            required
          />
        </div>

        {/* Provider and Model */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="provider" className="block text-sm font-medium text-dark-300 mb-2">
              Provider
            </label>
            <select
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="google">Google Gemini</option>
            </select>
          </div>

          <div>
            <label htmlFor="model" className="block text-sm font-medium text-dark-300 mb-2">
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled={isLoading}
            >
              <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
            </select>
          </div>
        </div>

        {/* Max Rounds */}
        <div>
          <label htmlFor="maxRounds" className="block text-sm font-medium text-dark-300 mb-2">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Max Rounds: {maxRounds}</span>
            </div>
          </label>
          <input
            type="range"
            id="maxRounds"
            min="1"
            max="5"
            value={maxRounds}
            onChange={(e) => setMaxRounds(parseInt(e.target.value))}
            className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs text-dark-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center space-x-2 text-purple-400 hover:text-purple-300 text-sm transition-colors"
        >
          <Settings className="w-4 h-4" />
          <span>{showAdvanced ? 'Hide' : 'Show'} Advanced Options</span>
        </button>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-dark-800 rounded-lg border border-dark-700">
            <div>
              <label htmlFor="context" className="block text-sm font-medium text-dark-300 mb-2">
                Context (Optional)
              </label>
              <textarea
                id="context"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Provide additional context for the prompt improvement..."
                rows={3}
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-dark-300 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                id="targetAudience"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="e.g., developers, marketers, students..."
                className="w-full px-4 py-3 bg-dark-700 border border-dark-600 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
              <div>
                <p className="text-red-400 text-sm font-medium">Error creating task</p>
                <p className="text-red-300 text-sm mt-1">{error}</p>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-red-400 hover:text-red-300 text-xs underline mt-2"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-3 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Creating Task...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Create Task</span>
            </div>
          )}
        </button>
      </form>
    </div>
  );
}
