import { useState, useEffect } from 'react';
import { Clock, Users, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useTaskWebSocket } from '../hooks/useWebSocket';
import type { Task } from '../types/api';

interface TaskProgressProps {
  task: Task;
  onCompleted: () => void;
  onReset: () => void;
}

export function TaskProgress({ task, onCompleted, onReset }: TaskProgressProps) {
  const [startTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState(0);

  const {
    taskStatus,
    progress,
    message,
    cancelTask,
  } = useTaskWebSocket({
    taskId: task.task_id,
    onCompleted: () => {
      onCompleted();
    },
    onFailed: () => {
      // Task failed, but we still want to show results if available
      onCompleted();
    },
  });

  // Update elapsed time
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    switch (taskStatus || task.status) {
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      case 'processing':
        return 'text-blue-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getStatusIcon = () => {
    switch (taskStatus || task.status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return (
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const currentProgress = progress || 0;
  const currentStatus = taskStatus || task.status;

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">
              Multi-Agent Processing
            </h2>
            <p className="text-dark-400 text-sm">
              AI agents are collaborating to improve your prompt
            </p>
          </div>
        </div>
        
        <button
          onClick={onReset}
          className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
          title="Cancel and create new task"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Original Prompt */}
      <div className="mb-6 p-4 bg-dark-800 rounded-lg border border-dark-700">
        <h3 className="text-sm font-medium text-dark-300 mb-2">Original Prompt</h3>
        <p className="text-white text-sm leading-relaxed">
          {task.original_prompt}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-dark-300">Progress</span>
          <span className="text-sm text-dark-400">{currentProgress}%</span>
        </div>
        <div className="w-full bg-dark-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${currentProgress}%` }}
          />
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-3 mb-6">
        {getStatusIcon()}
        <div>
          <p className={`font-medium ${getStatusColor()}`}>
            {currentStatus === 'pending' && 'Initializing...'}
            {currentStatus === 'processing' && 'Processing...'}
            {currentStatus === 'completed' && 'Completed'}
            {currentStatus === 'failed' && 'Failed'}
          </p>
          {message && (
            <p className="text-dark-400 text-sm mt-1">
              {message}
            </p>
          )}
        </div>
      </div>

      {/* Task Details */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2 text-sm">
          <Clock className="w-4 h-4 text-dark-400" />
          <span className="text-dark-300">Elapsed:</span>
          <span className="text-white font-mono">{formatTime(elapsedTime)}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <Users className="w-4 h-4 text-dark-400" />
          <span className="text-dark-300">Max Rounds:</span>
          <span className="text-white">{task.max_rounds || 3}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {(currentStatus === 'pending' || currentStatus === 'processing') && (
          <button
            onClick={cancelTask}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-900"
          >
            Cancel Task
          </button>
        )}
        
        {(currentStatus === 'completed' || currentStatus === 'failed') && (
          <button
            onClick={onCompleted}
            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium py-2 px-4 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-dark-900"
          >
            View Results
          </button>
        )}
      </div>

      {/* Real-time Updates Indicator */}
      <div className="mt-4 pt-4 border-t border-dark-800">
        <div className="flex items-center space-x-2 text-xs text-dark-500">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>Real-time updates active</span>
        </div>
      </div>
    </div>
  );
}
