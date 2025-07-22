import React, { useEffect, useState } from 'react';
import { useAppContext } from '../stores/AppContext';
import { apiClient } from '../api/client';
import type { RecentTask, TaskResult } from '../types/api';

export const RecentTasks: React.FC = () => {
  const { state } = useAppContext();
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskResult, setSelectedTaskResult] = useState<TaskResult | null>(null);
  const [isLoadingResult, setIsLoadingResult] = useState<number | null>(null);

  const loadRecentTasks = async () => {
    if (!state.providerSettings?.api_key) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await apiClient.getRecentTasks(state.providerSettings.api_key);
      if (response.success && response.data) {
        setRecentTasks(response.data);
      }
    } catch (error) {
      console.error('Error loading recent tasks:', error);
      setError('Failed to load recent tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTaskResult = async (taskId: number) => {
    if (!state.providerSettings?.api_key) return;

    try {
      setIsLoadingResult(taskId);
      setError(null);
      
      const response = await apiClient.getTaskResult(taskId, state.providerSettings.api_key);
      if (response.success && response.data) {
        setSelectedTaskResult(response.data);
      }
    } catch (error) {
      console.error('Error loading task result:', error);
      setError('Failed to load task result');
    } finally {
      setIsLoadingResult(null);
    }
  };

  useEffect(() => {
    if (state.providerSettings?.api_key) {
      loadRecentTasks();
    }
  }, [state.providerSettings?.api_key]);

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'completed': return '✅';
      case 'processing': return '⏳';
      case 'pending': return '🔄';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (!state.providerSettings?.api_key) {
    return null; // Don't show if no API key
  }

  return (
    <div className="card">
      <div className="card-header gradient-bg">
        <div className="section-header">
          <span className="emoji">📋</span>
          <span className="gradient-text">Recent Tasks</span>
        </div>
        <p className="text-gray-600 text-lg leading-relaxed">
          Your recent prompt improvement tasks and their results.
        </p>
      </div>
      
      <div className="card-content">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Task History</h3>
          <button
            onClick={loadRecentTasks}
            disabled={isLoading}
            className="btn btn-secondary text-sm"
          >
            {isLoading ? '🔄' : '🔄'} Refresh
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recent tasks...</p>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">📝 No tasks yet</p>
            <p className="text-gray-400 text-sm mt-2">
              Create your first prompt improvement task above!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.task_id}
                className="task-card hover:bg-white/90 transition-all duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getStatusEmoji(task.status)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-800">
                          Task #{task.task_id}
                        </span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          {task.improvement_type}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                          {task.provider}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(task.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {task.quality_score && (
                      <div className="text-center">
                        <div className="text-lg">
                          {task.quality_emoji}
                        </div>
                        <div className="text-xs text-gray-500">
                          {task.quality_score}/10
                        </div>
                      </div>
                    )}
                    
                    {task.processing_time && (
                      <div className="text-xs text-gray-500">
                        ⏱️ {task.processing_time}s
                      </div>
                    )}
                    
                    {task.has_result && (
                      <button
                        onClick={() => loadTaskResult(task.task_id)}
                        disabled={isLoadingResult === task.task_id}
                        className="btn btn-primary text-xs"
                      >
                        {isLoadingResult === task.task_id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Loading...
                          </>
                        ) : (
                          'View Result'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Task Result Modal */}
        {selectedTaskResult && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">
                  Task #{selectedTaskResult.task.task_id} - Result
                </h2>
                <button
                  onClick={() => setSelectedTaskResult(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Task Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Task Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Type:</span> {selectedTaskResult.task.improvement_type}
                    </div>
                    <div>
                      <span className="text-gray-600">Architecture:</span> {selectedTaskResult.task.architecture}
                    </div>
                    <div>
                      <span className="text-gray-600">Provider:</span> {selectedTaskResult.task.provider}
                    </div>
                    <div>
                      <span className="text-gray-600">Quality Score:</span> 
                      <span className="ml-1 font-medium">
                        {selectedTaskResult.improvement.quality_score}/10 {selectedTaskResult.improvement.quality_emoji}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Original Prompt */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">📝 Original Prompt</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedTaskResult.task.original_prompt}</p>
                  </div>
                </div>

                {/* Improved Prompt */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">✨ Improved Prompt</h3>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-gray-800 whitespace-pre-wrap">{selectedTaskResult.improvement.improved_prompt}</p>
                  </div>
                </div>

                {/* Analysis */}
                {selectedTaskResult.improvement.analysis && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">🔍 Analysis</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="font-medium text-gray-700">Main Goal:</span>
                        <p className="text-gray-600 mt-1">{selectedTaskResult.improvement.analysis.main_goal}</p>
                      </div>
                      {selectedTaskResult.improvement.analysis.identified_problems && selectedTaskResult.improvement.analysis.identified_problems.length > 0 && (
                        <div>
                          <span className="font-medium text-gray-700">Identified Problems:</span>
                          <ul className="list-disc list-inside text-gray-600 mt-1 space-y-1">
                            {selectedTaskResult.improvement.analysis.identified_problems.map((problem, index) => (
                              <li key={index}>{problem}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div>
                        <span className="font-medium text-gray-700">Improvement Potential:</span>
                        <p className="text-gray-600 mt-1">{selectedTaskResult.improvement.analysis.improvement_potential}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Applied Techniques */}
                {selectedTaskResult.improvement.improvements_metadata?.applied_techniques && (
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">🛠️ Applied Techniques</h3>
                    <div className="space-y-2">
                      {selectedTaskResult.improvement.improvements_metadata.applied_techniques.map((technique, index) => (
                        <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                          <div className="font-medium text-purple-800">{technique.name}</div>
                          <p className="text-purple-600 text-sm mt-1">{technique.description}</p>
                          <p className="text-purple-500 text-xs mt-1">Expected: {technique.expected_effect}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Copy Buttons */}
                <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => navigator.clipboard.writeText(selectedTaskResult.improvement.improved_prompt)}
                    className="btn btn-primary"
                  >
                    📋 Copy Improved Prompt
                  </button>
                  <button
                    onClick={() => setSelectedTaskResult(null)}
                    className="btn btn-secondary"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 