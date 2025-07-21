import { useCallback } from 'react';
import { useAppContext } from '../stores/AppContext';
import { apiClient, ApiClientError } from '../api/client';
import { validateTaskData } from '../utils/validation';
import type { CreateTaskRequest, TaskType, PromptArchitecture } from '../types/api';

export const useTask = () => {
  const { state, dispatch, setError, clearError } = useAppContext();

  // Create a new task
  const createTask = useCallback(async (data: {
    prompt: string;
    improvementType: TaskType;
    architecture?: PromptArchitecture;
    maxRounds?: number;
    context?: string;
    targetAudience?: string;
  }) => {
    if (!state.providerSettings) {
      setError('task', 'Provider settings are required');
      return null;
    }

    // Validate input data
    const validation = validateTaskData({
      prompt: data.prompt,
      provider: state.providerSettings.provider,
      modelName: state.providerSettings.ai_model,
      apiKey: state.providerSettings.api_key,
      context: data.context,
      targetAudience: data.targetAudience,
      maxRounds: data.maxRounds,
    });

    if (!validation.isValid) {
      setError('task', validation.errors.join(', '));
      return null;
    }

    try {
      dispatch({ type: 'SET_TASK_LOADING', payload: true });
      clearError('task');

      const request: CreateTaskRequest = {
        original_prompt: data.prompt,
        provider: state.providerSettings.provider,
        ai_model: state.providerSettings.ai_model,
        improvement_type: data.improvementType,
        architecture: data.architecture,
        max_rounds: data.maxRounds,
        context: data.context,
        target_audience: data.targetAudience,
      };

      const response = await apiClient.createTask(request, state.providerSettings.api_key);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_CURRENT_TASK', payload: response.data });
        return response.data;
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : 'Failed to create task. Please try again.';
      setError('task', errorMessage);
      return null;
    } finally {
      dispatch({ type: 'SET_TASK_LOADING', payload: false });
    }
  }, [state.providerSettings, dispatch, setError, clearError]);

  // Get task result
  const getTaskResult = useCallback(async (taskId: number) => {
    if (!state.providerSettings) {
      setError('task', 'Provider settings are required');
      return null;
    }

    try {
      clearError('task');

      const response = await apiClient.getTaskResult(taskId, state.providerSettings.api_key);
      
      if (response.success && response.data) {
        dispatch({ type: 'SET_TASK_RESULT', payload: response.data });
        return response.data;
      } else {
        throw new Error('Failed to get task result');
      }
    } catch (error) {
      console.error('Error getting task result:', error);
      const errorMessage = error instanceof ApiClientError 
        ? error.message 
        : 'Failed to get task result. Please try again.';
      setError('task', errorMessage);
      return null;
    }
  }, [state.providerSettings, dispatch, setError, clearError]);

  // Reset task state
  const resetTask = useCallback(() => {
    dispatch({ type: 'RESET_TASK_STATE' });
  }, [dispatch]);

  return {
    // State
    currentTask: state.currentTask,
    taskResult: state.taskResult,
    isLoading: state.isTaskLoading,
    error: state.errors.task,

    // Actions
    createTask,
    getTaskResult,
    resetTask,
  };
}; 