import React, { useEffect, useState } from 'react';
import { useAppContext } from '../stores/AppContext';
import { apiClient } from '../api/client';
import type { RecentTask, TaskResult } from '../types/api';
import { TaskResultAccordion } from './TaskResultAccordion';

export const RecentTasks: React.FC = () => {
  const { state } = useAppContext();
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<number>>(new Set());
  const [taskResults, setTaskResults] = useState<Map<number, TaskResult>>(new Map());
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

  const toggleTaskExpansion = async (taskId: number) => {
    const newExpanded = new Set(expandedTasks);
    
    if (newExpanded.has(taskId)) {
      // Collapse task
      newExpanded.delete(taskId);
    } else {
      // Expand task and load result if not already loaded
      newExpanded.add(taskId);
      
      if (!taskResults.has(taskId) && state.providerSettings?.api_key) {
        try {
          setIsLoadingResult(taskId);
          setError(null);
          
          const response = await apiClient.getTaskResult(taskId, state.providerSettings.api_key);
          if (response.success && response.data) {
            setTaskResults(prev => new Map(prev).set(taskId, response.data));
          }
        } catch (error) {
          console.error('Error loading task result:', error);
          setError('Failed to load task result');
        } finally {
          setIsLoadingResult(null);
        }
      }
    }
    
    setExpandedTasks(newExpanded);
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
            className="btn btn-secondary btn-sm"
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
                        onClick={() => toggleTaskExpansion(task.task_id)}
                        disabled={isLoadingResult === task.task_id}
                        className="btn btn-primary btn-xs"
                      >
                        {isLoadingResult === task.task_id ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                            Loading...
                          </>
                        ) : expandedTasks.has(task.task_id) ? (
                          'Hide Result'
                        ) : (
                          'View Result'
                        )}
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Accordion Results Display */}
                {expandedTasks.has(task.task_id) && taskResults.has(task.task_id) && (
                  <div className="mt-4 border-t border-gray-200 pt-4">
                    <TaskResultAccordion taskResult={taskResults.get(task.task_id)!} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}; 