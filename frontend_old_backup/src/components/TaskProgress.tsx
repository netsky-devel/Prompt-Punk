import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface TaskStatus {
  task_id: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  improvement_type: string;
  original_prompt: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
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

interface TaskProgressProps {
  taskId: string;
  task: {
    id: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    progress?: number;
    message?: string;
    step?: string;
    error?: string;
  };
  onCancel: () => void;
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed': return 'text-green-600';
    case 'failed': return 'text-red-600';
    case 'processing': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'processing': return '⏳';
    default: return '⏸️';
  }
};

export const TaskProgress: React.FC<TaskProgressProps> = ({ 
  taskId, 
  task, 
  onCancel 
}) => {
  console.log('TaskProgress render:', { taskId, status: taskStatus.status, taskStatus });
  
  // Only show for pending/processing tasks
  if (taskStatus.status !== 'pending' && taskStatus.status !== 'processing') {
    console.log('TaskProgress hidden due to status:', taskStatus.status);
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">📊 Task Status</h3>
      
      <div className="bg-gray-50 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-medium">Task ID: #{taskId}</span>
          <span className={`flex items-center font-medium ${getStatusColor(taskStatus.status)}`}>
            <span className="mr-1">{getStatusIcon(taskStatus.status)}</span>
            {taskStatus.status.toUpperCase()}
          </span>
        </div>
        <div className="text-sm text-gray-600">Multi-agent prompt improvement in progress</div>
      </div>

      {taskStatus.status === 'processing' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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

      {/* Multi-agent progress */}
      {taskStatus.multi_agent_progress && taskStatus.multi_agent_progress.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h4 className="font-semibold text-purple-800 mb-3 flex items-center gap-2">
            <span>🤖</span>
            Multi-Agent Progress
          </h4>
          
          <div className="space-y-3">
            {taskStatus.multi_agent_progress.map((session, index) => (
              <div key={index} className="bg-white rounded-lg border border-purple-200 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-800">Round {session.round_number}</span>
                    <span className="text-purple-600">• {session.agent_name}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {session.completed_at ? formatDateTime(session.completed_at) : 'In progress...'}
                  </div>
                </div>
                
                {session.techniques_applied && session.techniques_applied.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">Techniques Applied:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {session.techniques_applied.map((technique, techIndex) => (
                        <span key={techIndex} className="inline-block bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                          {technique}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel Task
        </button>
      </div>
    </div>
  );
};
