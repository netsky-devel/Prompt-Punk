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
      const response = await fetch('http://localhost:8000/api/v1/tasks/recent?limit=10');
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

      console.log('Creating task with data:', requestData);

      const response = await fetch('http://localhost:8000/api/v1/tasks/improve-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      console.log('Response received:', response.status, response.statusText);

      if (response.ok) {
        const result: TaskResponse = await response.json();
        setCurrentTask(result);
        setSelectedTaskId(result.task_id);
        loadRecentTasks(); // Refresh task list
      } else {
        const errorText = await response.text();
        console.error('HTTP Error:', response.status, response.statusText, errorText);
        alert(`Failed to create task: HTTP ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error creating task:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const startPolling = (taskId: number) => {
    stopPolling(); // Clear any existing interval
    
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}/status`);
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
      const response = await fetch(`http://localhost:8000/api/v1/tasks/${taskId}/status`);
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
    <div className="mx-auto space-y-8">
      <div className="card">
        <div className="card-header">
          <div className="section-header">
            <span className="emoji">🔥</span>
            <span className="gradient-text">Async Prompt Improvement</span>
          </div>
        </div>
        
        <div className="card-content">
          {/* Task Creation Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <span>✏️</span>
                Prompt to Improve *
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt that needs improvement..."
                className="textarea"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>🎯</span>
                  Improvement Type
                </label>
                <select
                  value={improvementType}
                  onChange={(e) => setImprovementType(e.target.value as 'single_agent' | 'multi_agent')}
                  className="input"
                >
                  <option value="single_agent">⚡ Single Agent (Fast)</option>
                  <option value="multi_agent">🤖 Multi-Agent Team (Elite Quality)</option>
                </select>
              </div>

              {improvementType === 'single_agent' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span>🏗️</span>
                    Architecture
                  </label>
                  <select
                    value={architecture}
                    onChange={(e) => setArchitecture(e.target.value)}
                    className="input"
                  >
                    <option value="auto">🎯 Auto (Recommended)</option>
                    <option value="chain_of_thought">🔗 Chain of Thought</option>
                    <option value="meta_cognitive">🧠 Meta-Cognitive</option>
                    <option value="5_tier_framework">🏗️ 5-Tier Framework</option>
                  </select>
                </div>
              )}

              {improvementType === 'multi_agent' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span>🔄</span>
                    Max Rounds
                  </label>
                  <input
                    type="number"
                    value={maxRounds}
                    onChange={(e) => setMaxRounds(parseInt(e.target.value))}
                    min="1"
                    max="20"
                    className="input"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>📝</span>
                  Context (Optional)
                </label>
                <input
                  type="text"
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="Additional context for the prompt..."
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span>👥</span>
                  Target Audience (Optional)
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="Who will use this prompt..."
                  className="input"
                />
              </div>
            </div>

            <button
              onClick={createTask}
              disabled={isCreatingTask || !prompt.trim() || !apiKey.trim()}
              className="btn btn-primary btn-lg w-full"
            >
              {isCreatingTask ? (
                <span className="flex items-center justify-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Creating Task...</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <span>🚀</span>
                  <span>Create {improvementType === 'single_agent' ? 'Fast' : 'Elite'} Improvement Task</span>
                </span>
              )}
            </button>
          </div>
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
                <div className="card border-red-200 bg-red-50/80">
                  <div className="card-content">
                    <h4 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                      <span className="text-lg">❌</span>
                      Task Failed
                    </h4>
                    <div className="text-sm text-red-700 bg-red-100 p-3 rounded-lg">
                      {taskStatus.error_message}
                    </div>
                  </div>
                </div>
              )}

              {taskStatus.status === 'completed' && taskStatus.improvements.length > 0 && (
                <div className="card border-green-200 bg-green-50/80">
                  <div className="card-header bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="section-header">
                      <span className="emoji">✅</span>
                      <span className="gradient-text">Improvement Results</span>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    {taskStatus.improvements.map((improvement, index) => (
                      <div key={index} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <span>📝</span>
                              Original Prompt
                            </h5>
                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-sm leading-relaxed">
                              {taskStatus.original_prompt}
                            </div>
                          </div>

                          <div>
                            <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <span>🚀</span>
                              Improved Prompt
                            </h5>
                            <div className="bg-white p-4 rounded-xl border border-green-200 max-h-96 overflow-y-auto shadow-inner">
                              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                                {improvement.improved_prompt}
                              </pre>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="card p-4 text-center">
                            <div className="text-2xl mb-2">
                              {improvement.quality_score >= 90 ? '🏆' : 
                               improvement.quality_score >= 75 ? '⭐' : '📊'}
                            </div>
                            <div className="text-xs text-gray-600 mb-1">Quality Score</div>
                            <div className={`text-lg font-bold ${
                              improvement.quality_score >= 90 ? 'text-green-600' : 
                              improvement.quality_score >= 75 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {improvement.quality_score}%
                            </div>
                          </div>
                          
                          <div className="card p-4 text-center">
                            <div className="text-2xl mb-2">⏱️</div>
                            <div className="text-xs text-gray-600 mb-1">Processing Time</div>
                            <div className="text-lg font-bold text-blue-600">
                              {improvement.processing_time_seconds.toFixed(1)}s
                            </div>
                          </div>
                          
                          <div className="card p-4 text-center">
                            <div className="text-2xl mb-2">🤖</div>
                            <div className="text-xs text-gray-600 mb-1">Provider</div>
                            <div className="text-sm font-semibold text-gray-700 capitalize">
                              {improvement.provider_used}
                            </div>
                          </div>
                          
                          <div className="card p-4 text-center">
                            <div className="text-2xl mb-2">🎯</div>
                            <div className="text-xs text-gray-600 mb-1">Model</div>
                            <div className="text-sm font-semibold text-gray-700">
                              {improvement.model_used}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Multi-agent progress */}
              {taskStatus.multi_agent_progress.length > 0 && (
                <div className="card border-purple-200 bg-purple-50/80">
                  <div className="card-header bg-gradient-to-r from-purple-50 to-indigo-50">
                    <div className="section-header">
                      <span className="emoji">🤖</span>
                      <span className="gradient-text">Multi-Agent Progress</span>
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="space-y-3">
                      {taskStatus.multi_agent_progress.map((session, index) => (
                        <div key={index} className="task-card">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-800 flex items-center gap-2">
                              <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">
                                Round {session.round_number}
                              </span>
                              <span className="capitalize">{session.agent_name}</span>
                            </span>
                            <span className="text-lg">
                              {session.completed_at ? '✅' : '⏳'}
                            </span>
                          </div>
                          
                          {session.techniques_applied && session.techniques_applied.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {session.techniques_applied.map((technique, techIndex) => (
                                <span 
                                  key={techIndex}
                                  className="text-xs bg-gradient-to-r from-purple-50 to-blue-50 text-purple-700 px-2 py-1 rounded-full border border-purple-200"
                                >
                                  {technique}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Tasks */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <div className="section-header">
              <span className="emoji">📚</span>
              <span className="gradient-text">Recent Tasks</span>
            </div>
            <button
              onClick={loadRecentTasks}
              className="btn btn-secondary btn-sm"
            >
              <span className="flex items-center gap-1">
                <span>🔄</span>
                <span>Refresh</span>
              </span>
            </button>
          </div>
        </div>

        <div className="card-content">
          {recentTasks.length === 0 ? (
            <div className="text-center text-gray-500 py-12 space-y-4">
              <div className="text-6xl opacity-50">📝</div>
              <div className="text-lg font-medium">No recent tasks found</div>
              <div className="text-sm">Create your first improvement task above!</div>
            </div>
          ) : (
            <div className="space-y-4">
              {recentTasks.map((task) => (
                <div
                  key={task.task_id}
                  className={`task-card cursor-pointer transition-all duration-300 ${
                    selectedTaskId === task.task_id ? 'ring-2 ring-blue-400 bg-blue-50/80' : ''
                  }`}
                  onClick={() => viewTaskResults(task.task_id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
                        #{task.task_id}
                      </span>
                      <span className={`flex items-center font-semibold ${getStatusColor(task.status)}`}>
                        <span className="mr-1 text-lg">{getStatusIcon(task.status)}</span>
                        <span className="capitalize">{task.status}</span>
                      </span>
                      <span className="text-sm bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200 font-medium">
                        {task.improvement_type.replace('_', ' ')}
                      </span>
                    </div>
                    {task.quality_score && (
                      <span className={`quality-badge font-bold ${
                        task.quality_score >= 90 ? 'quality-high' : 
                        task.quality_score >= 75 ? 'quality-medium' : 'quality-low'
                      }`}>
                        <span className="mr-1">
                          {task.quality_score >= 90 ? '🏆' : task.quality_score >= 75 ? '⭐' : '📊'}
                        </span>
                        {task.quality_score}% quality
                      </span>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                    <span className="font-medium text-gray-700">Original:</span> {task.original_prompt}
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
    </div>
  );
}; 