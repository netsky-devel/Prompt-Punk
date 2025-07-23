import { useState, useEffect } from 'react';
import { Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { RecentTask } from '../types/api';

interface RecentTasksProps {
  onTaskClick?: (taskId: number) => void;
}

export function RecentTasks({ onTaskClick }: RecentTasksProps) {
  const [tasks, setTasks] = useState<RecentTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { getRecentTasks } = useApi();

  useEffect(() => {
    const fetchTasks = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const recentTasks = await getRecentTasks();
        setTasks(recentTasks);
      } catch (err) {
        setError('Failed to load recent tasks');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [getRecentTasks]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'processing':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const truncatePrompt = (prompt: string | undefined | null, maxLength: number = 80) => {
    if (!prompt) return 'No prompt available';
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  return (
    <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Clock className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-dark-400 text-sm">Loading...</span>
          </div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-dark-600 mx-auto mb-2" />
          <p className="text-dark-400 text-sm">No recent tasks</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.task_id}
              onClick={() => onTaskClick?.(task.task_id)}
              className="bg-dark-800 rounded-lg p-4 border border-dark-700 hover:border-dark-600 transition-colors cursor-pointer hover:bg-dark-750"
            >
              {/* Task Header */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(task.status)}
                  <span className={`text-xs font-medium ${getStatusColor(task.status)} capitalize`}>
                    {task.status}
                  </span>
                </div>
                <span className="text-xs text-dark-500">
                  {formatDate(task.created_at)}
                </span>
              </div>

              {/* Task Content */}
              <div className="mb-3">
                <p className="text-white text-sm leading-relaxed">
                  {truncatePrompt(task.original_prompt)}
                </p>
              </div>

              {/* Task Details */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-3">
                  <span className="text-dark-400">
                    {task.provider} • {task.ai_model}
                  </span>
                  {task.improvement_type && (
                    <span className="text-purple-400 capitalize">
                      {task.improvement_type.replace('_', ' ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Processing Time */}
              {task.processing_time && (
                <div className="mt-2 pt-2 border-t border-dark-700">
                  <div className="flex items-center space-x-1 text-xs text-dark-400">
                    <Clock className="w-3 h-3" />
                    <span>Completed in {task.processing_time}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {!isLoading && (
        <div className="mt-4 pt-4 border-t border-dark-800">
          <button
            onClick={() => window.location.reload()}
            className="w-full text-center text-xs text-dark-400 hover:text-purple-400 transition-colors"
          >
            Refresh to see latest tasks
          </button>
        </div>
      )}
    </div>
  );
}
