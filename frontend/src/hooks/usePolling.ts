import { useEffect, useRef, useCallback } from 'react';
import { useAppContext } from '../stores/AppContext';
import { apiClient, ApiClientError } from '../api/client';
import { DEFAULT_SETTINGS } from '../constants';

export const usePolling = () => {
  const { state, dispatch, setError } = useAppContext();
  const intervalRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);

  // Check if we should poll for task status
  const shouldPoll = useCallback((taskId?: number) => {
    if (!taskId || !state.providerSettings?.api_key) return false;
    
    // Only poll for tasks that are pending or processing
    const currentTask = state.currentTask;
    if (!currentTask || currentTask.task_id !== taskId) return false;
    
    return currentTask.status === 'pending' || currentTask.status === 'processing';
  }, [state.currentTask, state.providerSettings]);

  // Poll task status
  const pollTaskStatus = useCallback(async (taskId: number) => {
    if (!state.providerSettings?.api_key || isPollingRef.current) {
      return;
    }

    try {
      isPollingRef.current = true;

      const response = await apiClient.getTaskStatus(taskId, state.providerSettings.api_key);
      
      if (response.success && response.data && response.data.task) {
        const { task } = response.data;
        
        // Update task state
        dispatch({ type: 'SET_CURRENT_TASK', payload: task });

        // If task is completed, get the result
        if (task && task.status === 'completed') {
          try {
            const resultResponse = await apiClient.getTaskResult(taskId, state.providerSettings.api_key);
            if (resultResponse.success && resultResponse.data) {
              dispatch({ type: 'SET_TASK_RESULT', payload: resultResponse.data });
            }
          } catch (error) {
            console.error('Error fetching task result:', error);
          }
          
          // Stop polling
          stopPolling();
        } else if (task && task.status === 'failed') {
          // Stop polling on failure
          stopPolling();
          setError('polling', 'Task failed to complete');
        }
      } else {
        console.warn('Invalid task status response:', response);
      }
    } catch (error) {
      console.error('Error polling task status:', error);
      // Don't stop polling on API errors, just log them
      if (error instanceof ApiClientError && error.status === 404) {
        // Task not found, stop polling
        stopPolling();
        setError('polling', 'Task not found');
      }
    } finally {
      isPollingRef.current = false;
    }
  }, [state.providerSettings, dispatch, setError]);

  // Start polling
  const startPolling = useCallback((taskId: number, interval = DEFAULT_SETTINGS.POLLING_INTERVAL) => {
    if (!shouldPoll(taskId)) {
      return;
    }

    // Clear any existing interval
    stopPolling();

    // Start immediate poll
    pollTaskStatus(taskId);

    // Set up interval
    intervalRef.current = setInterval(() => {
      if (shouldPoll(taskId)) {
        pollTaskStatus(taskId);
      } else {
        stopPolling();
      }
    }, interval);
  }, [shouldPoll, pollTaskStatus]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Auto-start polling when a new task is created
  useEffect(() => {
    const currentTask = state.currentTask;
    
    if (currentTask && shouldPoll(currentTask.task_id)) {
      startPolling(currentTask.task_id);
    } else {
      stopPolling();
    }

    // Cleanup on unmount or when task changes
    return () => {
      stopPolling();
    };
  }, [state.currentTask, shouldPoll, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    isPolling: intervalRef.current !== null,
    startPolling,
    stopPolling,
    pollTaskStatus,
  };
}; 