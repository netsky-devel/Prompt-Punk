import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import type { CreateTaskRequest, Task, TaskResult, RecentTask } from '../types/api';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createTask = useCallback(async (request: CreateTaskRequest): Promise<Task | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.createTask(request);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create task');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTaskResult = useCallback(async (taskId: number): Promise<TaskResult | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getTaskResult(taskId);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get task result');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRecentTasks = useCallback(async (): Promise<RecentTask[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.getRecentTasks();
      
      if (response.success && response.data) {
        return response.data;
      } else {
        setError(response.error || 'Failed to get recent tasks');
        return [];
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const testApiKey = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.testApiKey();
      
      if (response.success && response.data) {
        return response.data.valid;
      } else {
        setError(response.error || 'Failed to test API key');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    clearError,
    createTask,
    getTaskResult,
    getRecentTasks,
    testApiKey,
  };
}
