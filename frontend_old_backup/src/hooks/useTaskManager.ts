import { useState, useEffect, useCallback } from 'react';

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

interface UseTaskManagerProps {
  apiKey: string;
  onTaskCompleted?: () => void;
}

export const useTaskManager = ({ apiKey, onTaskCompleted }: UseTaskManagerProps) => {
  const [currentTask, setCurrentTask] = useState<TaskResponse | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopPolling = useCallback(() => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [pollingInterval]);

  const checkTaskStatus = useCallback(async (taskId: number) => {
    try {
      console.log('Checking task status for task:', taskId);
      const response = await fetch(`/api/v1/tasks/${taskId}/status`, {
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check task status');
      }

      const apiResponse = await response.json();
      console.log('API response received:', apiResponse);
      
      // Handle API response format {success: true, data: {...}}
      let status: TaskStatus;
      if (apiResponse.success && apiResponse.data) {
        status = apiResponse.data;
      } else {
        // Fallback for direct response format
        status = apiResponse;
      }
      
      console.log('Task status received:', status.status, status);
      setTaskStatus(status);

      // Stop polling if task is completed or failed
      if (status.status === 'completed' || status.status === 'failed') {
        console.log('Task finished, stopping polling');
        stopPolling();
        
        // Notify parent component that task is completed
        if (onTaskCompleted) {
          onTaskCompleted();
        }
        
        // Clear current task immediately to hide progress
        // TaskProgress component will handle the display logic based on status
        setTimeout(() => {
          setCurrentTask(null);
          setTaskStatus(null);
        }, 2000); // Show result for 2 seconds before clearing state
      }

      return status;
    } catch (error) {
      console.error('Error checking task status:', error);
      setError(error instanceof Error ? error.message : 'Failed to check task status');
      stopPolling();
      return null;
    }
  }, [apiKey, stopPolling]);

  const startPolling = useCallback((taskId: number) => {
    console.log('Starting polling for task:', taskId);
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }

    // Start polling immediately
    checkTaskStatus(taskId);

    const interval = setInterval(() => {
      checkTaskStatus(taskId);
    }, 2000);

    setPollingInterval(interval);
  }, [checkTaskStatus, pollingInterval]);

  const submitTask = useCallback(async (taskData: {
    original_prompt: string;
    provider: string;
    model: string;
    architecture: string;
    max_rounds: number;
  }) => {
    setIsSubmitting(true);
    setError(null);
    setCurrentTask(null);
    setTaskStatus(null);

    try {
      const response = await fetch('/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify({
          ...taskData,
          improvement_type: 'multi_agent'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit task');
      }

      const apiResponse = await response.json();
      console.log('Submit task API response:', apiResponse);
      
      // Handle API response format {success: true, data: {...}}
      let taskResponse: TaskResponse;
      if (apiResponse.success && apiResponse.data) {
        taskResponse = apiResponse.data;
      } else {
        // Fallback for direct response format
        taskResponse = apiResponse;
      }
      
      console.log('Task created:', taskResponse);
      setCurrentTask(taskResponse);
      startPolling(taskResponse.task_id);
      
      return taskResponse;
    } catch (error) {
      console.error('Error submitting task:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [apiKey, startPolling]);

  const cancelTask = useCallback(async () => {
    if (!currentTask) return;

    try {
      const response = await fetch(`/api/v1/tasks/${currentTask.task_id}/cancel`, {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('Failed to cancel task');
      }

      stopPolling();
      setCurrentTask(null);
      setTaskStatus(null);
    } catch (error) {
      console.error('Error canceling task:', error);
      setError(error instanceof Error ? error.message : 'Failed to cancel task');
    }
  }, [currentTask, apiKey, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  return {
    currentTask,
    taskStatus,
    isSubmitting,
    error,
    submitTask,
    cancelTask,
    clearError: () => setError(null)
  };
};
