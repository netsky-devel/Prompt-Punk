import React, { useState, useEffect } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface ProviderSettings {
  provider: string;
  model_name: string;
  api_key: string;
  temperature: number;
  max_tokens: number;
}

interface TaskResponse {
  task_id: number;
  status: string;
  message: string;
}

interface TaskStatus {
  task_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  improvement_type: string;
  original_prompt: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  improvements: Array<{
    improved_prompt: string;
    analysis: any;
    improvements_metadata: any;
    quality_score: number;
    processing_time_seconds: number;
    provider_used: string;
    model_used: string;
    architecture_used: string;
    created_at: string;
  }>;
  multi_agent_progress: Array<{
    round_number: number;
    agent_name: string;
    feedback: any;
    prompt_version: string;
    techniques_applied: string[];
    started_at: string;
    completed_at?: string;
    processing_time_seconds?: number;
  }>;
}

interface RecentTask {
  task_id: number;
  status: string;
  improvement_type: string;
  original_prompt: string;
  created_at: string;
  completed_at?: string;
  has_results: boolean;
  quality_score?: number;
}

interface AsyncTaskInterfaceProps {
  apiKey: string;
  modelName: string;
}

export const AsyncTaskInterface: React.FC<AsyncTaskInterfaceProps> = ({ 
  apiKey, 
  modelName 
}) => {
  const [prompt, setPrompt] = useState('');
  const [improvementType, setImprovementType] = useState<'single_agent' | 'multi_agent'>('single_agent');
  const [architecture, setArchitecture] = useState('auto');
  const [maxRounds, setMaxRounds] = useState(5);
  const [context, setContext] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [currentTask, setCurrentTask] = useState<TaskResponse | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Load recent tasks on mount
  useEffect(() => {
    loadRecentTasks();
  }, []);

  // Start polling when we have a current task
  useEffect(() => {
    if (currentTask && currentTask.task_id) {
      startPolling(currentTask.task_id);
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [currentTask]);

  const loadRecentTasks = async () => {
    try {
      const response = await fetch('/api/v1/tasks/recent?limit=10');
      const data = await response.json();
      setRecentTasks(data.tasks || []);
    } catch (error) {
      console.error('Failed to load recent tasks:', error);
    }
  };

  const createTask = async () => {
    if (!prompt.trim()) {
      alert('Please enter a prompt to improve');
      return;
    }

    if (!apiKey.trim()) {
      alert('Please enter an API key');
      return;
    }

    setIsCreatingTask(true);
    setCurrentTask(null);
    setTaskStatus(null);

    try {
      const requestData = {
        original_prompt: prompt,
        provider_settings: {
          provider: 'google',
          model_name: modelName,
          api_key: apiKey,
          temperature: 0.7,
          max_tokens: 2000
        },
        improvement_type: improvementType,
        architecture: improvementType === 'single_agent' ? architecture : undefined,
        max_rounds: improvementType === 'multi_agent' ? maxRounds : undefined,
        context: context || undefined,
        target_audience: targetAudience || undefined
      };

      const response = await fetch('/api/v1/tasks/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      const result: TaskResponse = await response.json();
      
      if (response.ok) {
        setCurrentTask(result);
        setSelectedTaskId(result.task_id);
        loadRecentTasks(); // Refresh task list
      } else {
        alert(`Failed to create task: ${result.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Failed to create task. Please try again.');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const startPolling = (taskId: number) => {
    stopPolling(); // Clear any existing interval
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/v1/tasks/${taskId}/status`);
        const status: TaskStatus = await response.json();
        
        setTaskStatus(status);
        
        // Stop polling if task is completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          stopPolling();
          loadRecentTasks(); // Refresh task list
        }
      } catch (error) {
        console.error('Error polling task status:', error);
      }
    }, 2000); // Poll every 2 seconds
    
    setPollingInterval(interval);
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const viewTaskResults = async (taskId: number) => {
    try {
      const response = await fetch(`/api/v1/tasks/${taskId}/status`);
      const status: TaskStatus = await response.json();
      setTaskStatus(status);
      setSelectedTaskId(taskId);
      setCurrentTask({ task_id: taskId, status: status.status, message: 'Viewing task results' });
    } catch (error) {
      console.error('Error loading task results:', error);
      alert('Failed to load task results');
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'processing': return 'text-blue-600';
      case 'completed': return 'text-green-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'processing': return '⚡';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '❓';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">🔥 Async Prompt Improvement</h2>
        
        {/* Task Creation Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prompt to Improve *
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt that needs improvement..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Improvement Type
              </label>
              <select
                value={improvementType}
                onChange={(e) => setImprovementType(e.target.value as 'single_agent' | 'multi_agent')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="single_agent">⚡ Single Agent (Fast)</option>
                <option value="multi_agent">🤖 Multi-Agent Team (Elite Quality)</option>
              </select>
            </div>

            {improvementType === 'single_agent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Architecture
                </label>
                <select
                  value={architecture}
                  onChange={(e) => setArchitecture(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto (Recommended)</option>
                  <option value="chain_of_thought">Chain of Thought</option>
                  <option value="meta_cognitive">Meta-Cognitive</option>
                  <option value="5_tier_framework">5-Tier Framework</option>
                </select>
              </div>
            )}

            {improvementType === 'multi_agent' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Rounds
                </label>
                <input
                  type="number"
                  value={maxRounds}
                  onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Context (Optional)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Additional context for the prompt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience (Optional)
              </label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Who will use this prompt..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={createTask}
            disabled={isCreatingTask || !prompt.trim() || !apiKey.trim()}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isCreatingTask ? (
              <span className="flex items-center justify-center">
                <LoadingSpinner size="sm" />
                <span className="ml-2">Creating Task...</span>
              </span>
            ) : (
              `🚀 Create ${improvementType === 'single_agent' ? 'Fast' : 'Elite'} Improvement Task`
            )}
          </button>
        </div>
      </div>

      {/* Current Task Status */}
      {currentTask && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Task Status</h3>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Task ID: #{currentTask.task_id}</span>
              {taskStatus && (
                <span className={`flex items-center font-medium ${getStatusColor(taskStatus.status)}`}>
                  <span className="mr-1">{getStatusIcon(taskStatus.status)}</span>
                  {taskStatus.status.toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600">{currentTask.message}</div>
          </div>

          {taskStatus && (
            <div className="space-y-4">
              {taskStatus.status === 'processing' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <LoadingSpinner size="sm" />
                    <span className="ml-2 font-medium text-blue-800">
                      Processing in background... Please wait.
                    </span>
                  </div>
                  <div className="text-sm text-blue-600 mt-2">
                    Started: {taskStatus.started_at ? formatDateTime(taskStatus.started_at) : 'Starting...'}
                  </div>
                </div>
              )}

              {taskStatus.status === 'failed' && taskStatus.error_message && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-800 mb-2">❌ Task Failed</h4>
                  <div className="text-sm text-red-600">{taskStatus.error_message}</div>
                </div>
              )}

              {taskStatus.status === 'completed' && taskStatus.improvements.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <h4 className="font-bold text-green-800 mb-4">✅ Improvement Results</h4>
                  
                  {taskStatus.improvements.map((improvement, index) => (
                    <div key={index} className="space-y-4">
                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">📝 Original Prompt:</h5>
                        <div className="bg-gray-100 p-3 rounded text-sm">
                          {taskStatus.original_prompt}
                        </div>
                      </div>

                      <div>
                        <h5 className="font-medium text-gray-800 mb-2">🚀 Improved Prompt:</h5>
                        <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                          <pre className="whitespace-pre-wrap text-sm">{improvement.improved_prompt}</pre>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Quality Score:</span>
                          <div className="text-green-600 font-bold">{improvement.quality_score}%</div>
                        </div>
                        <div>
                          <span className="font-medium">Processing Time:</span>
                          <div>{improvement.processing_time_seconds.toFixed(1)}s</div>
                        </div>
                        <div>
                          <span className="font-medium">Provider:</span>
                          <div>{improvement.provider_used}</div>
                        </div>
                        <div>
                          <span className="font-medium">Model:</span>
                          <div>{improvement.model_used}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Multi-agent progress */}
              {taskStatus.multi_agent_progress.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-medium text-purple-800 mb-3">🤖 Multi-Agent Progress</h4>
                  <div className="space-y-2">
                    {taskStatus.multi_agent_progress.map((session, index) => (
                      <div key={index} className="bg-white p-3 rounded text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            Round {session.round_number}: {session.agent_name}
                          </span>
                          <span className="text-gray-500">
                            {session.completed_at ? '✅' : '⏳'}
                          </span>
                        </div>
                        {session.techniques_applied && session.techniques_applied.length > 0 && (
                          <div className="text-gray-600 mt-1">
                            Techniques: {session.techniques_applied.join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800">📚 Recent Tasks</h3>
          <button
            onClick={loadRecentTasks}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            🔄 Refresh
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No recent tasks found. Create your first improvement task above!
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => (
              <div
                key={task.task_id}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedTaskId === task.task_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => viewTaskResults(task.task_id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800">#{task.task_id}</span>
                    <span className={`ml-3 flex items-center font-medium ${getStatusColor(task.status)}`}>
                      <span className="mr-1">{getStatusIcon(task.status)}</span>
                      {task.status}
                    </span>
                    <span className="ml-3 text-sm bg-gray-200 px-2 py-1 rounded">
                      {task.improvement_type.replace('_', ' ')}
                    </span>
                  </div>
                  {task.quality_score && (
                    <span className="text-green-600 font-bold text-sm">
                      {task.quality_score}% quality
                    </span>
                  )}
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  {task.original_prompt}
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Created: {formatDateTime(task.created_at)}</span>
                  {task.completed_at && (
                    <span>Completed: {formatDateTime(task.completed_at)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}; 