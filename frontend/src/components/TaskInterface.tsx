import React, { useState } from 'react';
import { useTask } from '../hooks/useTask';
import { usePolling } from '../hooks/usePolling';
import { useProvider } from '../hooks/useProvider';
import { ARCHITECTURE_LABELS } from '../constants';
import type { TaskType, PromptArchitecture } from '../types/api';

export const TaskInterface: React.FC = () => {
  const { areSettingsComplete, isProviderValid } = useProvider();
  const { createTask, currentTask, taskResult, isLoading, error, resetTask } = useTask();
  usePolling(); // Start polling automatically

  // Form state
  const [prompt, setPrompt] = useState('');
  const improvementType: TaskType = 'multi_agent';
  const [architecture, setArchitecture] = useState<PromptArchitecture>('auto');
  const [maxRounds, setMaxRounds] = useState(5);
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!areSettingsComplete || !isProviderValid) {
      return;
    }

    const task = await createTask({
      prompt,
      improvementType,
      architecture,
      maxRounds: improvementType === 'multi_agent' ? maxRounds : undefined,
      context: context.trim() || undefined,
      targetAudience: targetAudience.trim() || undefined,
    });

    if (task) {
      // Form will be hidden, so we don't need to reset it
    }
  };

  const handleNewTask = () => {
    resetTask();
    setPrompt('');
    setContext('');
    setTargetAudience('');
  };

  const canSubmit = areSettingsComplete && isProviderValid && prompt.trim().length >= 10;

  // Prevent rapid state switching that causes flickering
  const shouldShowResult = taskResult && currentTask?.status === 'completed';
  const shouldShowProgress = currentTask && !shouldShowResult && (currentTask.status === 'pending' || currentTask.status === 'processing');
  const shouldShowForm = !shouldShowResult && !shouldShowProgress;

  // Show task result if completed
  if (shouldShowResult) {
    return (
      <div className="card">
        <div className="card-header gradient-bg">
          <div className="section-header">
            <span className="emoji">✅</span>
            <span className="gradient-text">Task Completed</span>
          </div>
        </div>
        
        <div className="card-content space-y-6">
          {/* Task Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Task Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Type:</span> {taskResult.task.improvement_type}
              </div>
              <div>
                <span className="text-gray-600">Architecture:</span> {taskResult.task.architecture}
              </div>
              <div>
                <span className="text-gray-600">Provider:</span> {taskResult.task.provider}
              </div>
              <div>
                <span className="text-gray-600">Quality Score:</span> {taskResult.improvement.quality_score}
              </div>
            </div>
          </div>

          {/* Original Prompt */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Original Prompt</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{taskResult.task.original_prompt}</p>
            </div>
          </div>

          {/* Improved Prompt */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">Improved Prompt</h3>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-gray-800">{taskResult.improvement.improved_prompt}</p>
            </div>
          </div>

          {/* Analysis */}
          {taskResult.improvement.analysis && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-2">Analysis</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">Main Goal:</span>
                    <p className="text-gray-600 mt-1">{taskResult.improvement.analysis.main_goal}</p>
                  </div>
                  {taskResult.improvement.analysis.identified_problems && (
                    <div>
                      <span className="font-medium text-gray-700">Identified Problems:</span>
                      <ul className="list-disc list-inside text-gray-600 mt-1">
                        {taskResult.improvement.analysis.identified_problems.map((problem, index) => (
                          <li key={index}>{problem}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* New Task Button */}
          <div className="flex justify-center">
            <button
              onClick={handleNewTask}
              className="btn btn-primary"
            >
              🔥 Create New Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show task progress if task is running
  if (shouldShowProgress) {
    return (
      <div className="card">
        <div className="card-header gradient-bg">
          <div className="section-header">
            <span className="emoji">⏳</span>
            <span className="gradient-text">Task in Progress</span>
          </div>
        </div>
        
        <div className="card-content space-y-4">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-blue-800 font-medium">
                {currentTask.status === 'pending' ? 'Starting task...' : 'Processing prompt...'}
              </span>
            </div>
          </div>

          {/* Task Details */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Task Details</h3>
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-600">Type:</span> {currentTask.improvement_type}</div>
              <div><span className="text-gray-600">Architecture:</span> {currentTask.architecture}</div>
              <div><span className="text-gray-600">Status:</span> {currentTask.status}</div>
            </div>
          </div>

          {/* Original Prompt */}
          <div>
            <h3 className="font-semibold mb-2">Original Prompt</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700">{currentTask.original_prompt}</p>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="flex justify-center">
            <button
              onClick={handleNewTask}
              className="btn btn-secondary"
            >
              Cancel Task
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show task creation form
  if (shouldShowForm) {
    return (
      <div className="card">
        <div className="card-header gradient-bg">
          <div className="section-header">
            <span className="emoji">🔥</span>
            <span className="gradient-text">Prompt Improvement</span>
          </div>
        </div>
        
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Original Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="input min-h-[120px] resize-y"
                placeholder="Enter your prompt here... (minimum 10 characters)"
                required
                minLength={10}
                maxLength={10000}
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {prompt.length}/10000 characters
              </div>
            </div>

            {/* Task Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Improvement Type */}


              {/* Architecture */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🏗️ Architecture
                </label>
                <select
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value as PromptArchitecture)}
                  className="input"
                >
                  {Object.entries(ARCHITECTURE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Multi-Agent Options */}
            {improvementType === 'multi_agent' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  🔄 Max Rounds
                </label>
                <input
                  type="number"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(Number(e.target.value))}
                  className="input"
                  min={1}
                  max={20}
                />
              </div>
            )}

            {/* Optional Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  📋 Context (Optional)
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  className="input resize-y"
                  placeholder="Provide context for your prompt..."
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  👥 Target Audience (Optional)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="input"
                  placeholder="Who is the intended audience?"
                  maxLength={500}
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <div className="mt-6 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">⚠️ {error}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="mt-8 flex justify-center">
              <button
                type="submit"
                disabled={!canSubmit || isLoading}
                className={`btn px-8 py-3 text-lg font-semibold ${canSubmit ? 'btn-primary' : 'btn-disabled'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    Creating Task...
                  </>
                ) : (
                  '🚀 Improve Prompt'
                )}
              </button>
            </div>

            {/* Requirements Note */}
            {!areSettingsComplete && (
              <div className="mt-6 text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  ⚠️ Please configure your provider settings above before creating tasks.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    );
  }

  // Fallback if no specific state is met (should ideally not be reached)
  return null;
}; 