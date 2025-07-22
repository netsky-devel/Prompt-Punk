import React, { useState, useEffect } from 'react';
import { TaskForm } from './TaskForm';
import { TaskProgress } from './TaskProgress';
import { ErrorDisplay } from './ErrorDisplay';
import { RecentTasks } from './RecentTasks';
import { useTaskManager } from '../hooks/useTaskManager';

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
    taskStatus,
    isSubmitting,
    error,
    submitTask,
    cancelTask,
    clearError
  } = useTaskManager({ 
    apiKey,
    onTaskCompleted: () => {
      // Force RecentTasks to refresh by changing key
      setRecentTasksKey(prev => prev + 1);
    }
  });

  // Debug logging
  useEffect(() => {
    if (currentTask && taskStatus) {
      console.log('AsyncTaskInterface - currentTask:', currentTask, 'taskStatus:', taskStatus);
    }
  }, [currentTask, taskStatus]);

  const handleTaskSubmitted = async (taskData: {
    original_prompt: string;
    provider: string;
    architecture: string;
    max_rounds: number;
  }) => {
    try {
      await submitTask({
        ...taskData,
        model: modelName
      });
    } catch (error) {
      // Error is already handled by useTaskManager
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
      {currentTask && taskStatus && (
        <TaskProgress
          taskId={currentTask.task_id}
          taskStatus={taskStatus}
          onCancel={cancelTask}
        />
      )}

      {/* Recent Tasks */}
      <RecentTasks key={recentTasksKey} />
    </div>
  );
};

// Legacy export for backward compatibility
export default AsyncTaskInterface;
