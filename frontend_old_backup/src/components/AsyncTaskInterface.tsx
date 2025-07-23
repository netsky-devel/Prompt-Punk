import React, { useState, useEffect } from 'react';
import { TaskForm } from './TaskForm';
import { TaskProgress } from './TaskProgressWebSocket';
import { ErrorDisplay } from './ErrorDisplay';
import { RecentTasks } from './RecentTasks';
import { useTaskManagerWebSocket } from '../hooks/useTaskManagerWebSocket';

interface AsyncTaskInterfaceProps {
  apiKey: string;
  modelName: string;
}

export const AsyncTaskInterface: React.FC<AsyncTaskInterfaceProps> = ({ 
  apiKey, 
  modelName 
}) => {
  const [recentTasksKey, setRecentTasksKey] = useState(0);
  
  const {
    currentTask,
    isSubmitting,
    error,
    isConnected,
    connectionError,
    submitTask,
    cancelTask,
    clearError,
    isTaskRunning
  } = useTaskManagerWebSocket({ 
    apiKey,
    onTaskCompleted: () => {
      // Force RecentTasks to refresh by changing key
      setRecentTasksKey(prev => prev + 1);
    }
  });

  // Debug logging
  useEffect(() => {
    if (currentTask) {
      console.log('AsyncTaskInterface - currentTask:', currentTask, 'WebSocket connected:', isConnected);
    }
  }, [currentTask, isConnected]);

  const handleTaskSubmitted = async (taskData: {
    original_prompt: string;
    provider: string;
    architecture: string;
    max_rounds: number;
  }) => {
    try {
      await submitTask(taskData.original_prompt, {
        provider: taskData.provider,
        model: modelName,
        maxRounds: taskData.max_rounds
      });
    } catch (error) {
      // Error is already handled by useTaskManagerWebSocket
    }
  };

  return (
    <div className="space-y-8">
      {/* Error Display */}
      {error && (
        <ErrorDisplay error={error} onDismiss={clearError} />
      )}

      {/* Task Form */}
      <TaskForm
        onTaskSubmitted={handleTaskSubmitted}
        onError={clearError}
        isSubmitting={isSubmitting}
      />

      {/* Task Progress - Only shows for pending/processing tasks */}
      {currentTask && isTaskRunning && (
        <TaskProgress
          taskId={currentTask.id}
          task={currentTask}
          onCancel={cancelTask}
        />
      )}
      
      {/* Connection Status */}
      {connectionError && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                WebSocket Connection Issue
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>{connectionError}</p>
                <p className="mt-1">Task updates may be delayed. The system will attempt to reconnect automatically.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tasks */}
      <RecentTasks key={recentTasksKey} />
    </div>
  );
};

// Legacy export for backward compatibility
export default AsyncTaskInterface;
