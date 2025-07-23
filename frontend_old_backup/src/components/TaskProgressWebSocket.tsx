import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

interface Task {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  step?: string;
  error?: string;
}

interface TaskProgressProps {
  taskId: string;
  task: Task;
  onCancel: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending': return 'text-yellow-600';
    case 'in_progress': return 'text-blue-600';
    case 'completed': return 'text-green-600';
    case 'failed': return 'text-red-600';
    case 'cancelled': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'pending': return '⏳';
    case 'in_progress': return '⚡';
    case 'completed': return '✅';
    case 'failed': return '❌';
    case 'cancelled': return '🚫';
    default: return '❓';
  }
};

export const TaskProgress: React.FC<TaskProgressProps> = ({ 
  taskId, 
  task, 
  onCancel 
}) => {
  console.log('🎯 TaskProgress render:', { taskId, task });

  const progress = task.progress || 0;
  const isRunning = task.status === 'in_progress' || task.status === 'pending';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          🎸 Task Progress
        </h3>
        {isRunning && (
          <button
            onClick={onCancel}
            className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
          >
            Cancel Task
          </button>
        )}
      </div>

      {/* Status */}
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-2">{getStatusIcon(task.status)}</span>
        <div>
          <p className={`font-medium ${getStatusColor(task.status)}`}>
            {task.status.replace('_', ' ').toUpperCase()}
          </p>
          <p className="text-sm text-gray-600">Task ID: {taskId}</p>
        </div>
      </div>

      {/* Progress Bar */}
      {isRunning && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Current Step/Message */}
      {task.message && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Current Step:</p>
          <div className="flex items-center">
            {isRunning && <LoadingSpinner size="sm" className="mr-2" />}
            <p className="text-sm text-gray-600">{task.message}</p>
          </div>
          {task.step && (
            <p className="text-xs text-gray-500 mt-1">Step: {task.step}</p>
          )}
        </div>
      )}

      {/* Error Message */}
      {task.error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm font-medium text-red-800">Error:</p>
          <p className="text-sm text-red-700">{task.error}</p>
        </div>
      )}

      {/* WebSocket Status Indicator */}
      <div className="flex items-center text-xs text-gray-500">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        <span>Real-time updates via WebSocket</span>
      </div>
    </div>
  );
};
