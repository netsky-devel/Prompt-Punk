import { useState, useCallback, useRef } from 'react';
import { useWebSocket } from './useWebSocket';

export interface Task {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
  progress?: number;
  message?: string;
  step?: string;
  error?: string;
  result?: any;
}

interface UseTaskManagerOptions {
  apiKey: string;
  onTaskCompleted?: (taskId: string) => void;
}

export const useTaskManagerWebSocket = (options: UseTaskManagerOptions) => {
  const { apiKey, onTaskCompleted } = options;
  
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  
  // Keep track of task completion to avoid duplicate callbacks
  const completedTasksRef = useRef<Set<string>>(new Set());

  // Handle WebSocket messages for task updates
  const handleWebSocketMessage = useCallback((message: any) => {
    console.log('📨 Task update received:', message);
    
    const { task_id, status, progress, message: msg, step, error: taskError } = message;
    
    if (!task_id) return;

    // Update current task if it matches
    setCurrentTask(prevTask => {
      if (!prevTask || prevTask.id !== task_id) {
        // If we don't have a current task or it's different, create/update it
        return {
          id: task_id,
          status: status || 'in_progress',
          progress: progress || 0,
          message: msg || 'Processing...',
          step: step,
          error: taskError
        };
      }

      // Update existing task
      return {
        ...prevTask,
        status: status || prevTask.status,
        progress: progress !== undefined ? progress : prevTask.progress,
        message: msg || prevTask.message,
        step: step || prevTask.step,
        error: taskError || prevTask.error
      };
    });

    // Handle task completion
    if ((status === 'completed' || status === 'failed' || status === 'cancelled') && 
        !completedTasksRef.current.has(task_id)) {
      
      completedTasksRef.current.add(task_id);
      
      // Call completion callback after a short delay to ensure UI updates
      setTimeout(() => {
        onTaskCompleted?.(task_id);
        
        // Clear current task and active task ID after completion callback
        setCurrentTask(prevTask => {
          if (prevTask?.id === task_id) {
            setActiveTaskId(null);
            return null;
          }
          return prevTask;
        });
      }, 1000);
    }
  }, [onTaskCompleted]);

  // WebSocket connection
  const { isConnected, connectionError, cancelTask: wsCancel } = useWebSocket({
    apiKey,
    taskId: activeTaskId || undefined,
    onMessage: handleWebSocketMessage,
    onError: (error) => {
      console.error('WebSocket error:', error);
      setError('WebSocket connection error');
    },
    onConnect: () => {
      console.log('🔌 WebSocket connected for task management');
      setError(null);
    },
    onDisconnect: () => {
      console.log('🔌 WebSocket disconnected');
    }
  });

  // Submit a new task
  const submitTask = useCallback(async (prompt: string, options: any = {}) => {
    if (!apiKey) {
      setError('API key is required');
      return null;
    }

    setIsSubmitting(true);
    setError(null);
    
    // Clear any previous completed tasks from tracking
    completedTasksRef.current.clear();

    try {
      const response = await fetch('http://localhost:3000/api/v1/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({
          task: {
            original_prompt: prompt,
            provider: options.provider || 'google',
            ai_model: options.model || 'gemini-1.5-flash',
            improvement_type: 'multi_agent',
            max_rounds: options.maxRounds || 3,
            ...options
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Task submission failed');
      }

      const taskId = data.data.id;
      console.log('✅ Task submitted successfully:', taskId);

      // Set active task ID for WebSocket subscription
      setActiveTaskId(taskId);

      // Initialize current task
      setCurrentTask({
        id: taskId,
        status: 'pending',
        progress: 0,
        message: 'Task submitted, waiting to start...'
      });

      return taskId;

    } catch (error: any) {
      console.error('❌ Task submission error:', error);
      setError(error.message || 'Failed to submit task');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [apiKey]);

  // Cancel current task
  const cancelTask = useCallback(async () => {
    if (!currentTask) return false;

    try {
      // Try WebSocket cancellation first
      if (isConnected) {
        const success = wsCancel(currentTask.id);
        if (success) {
          console.log('🚫 Task cancellation sent via WebSocket');
          return true;
        }
      }

      // Fallback to HTTP API
      const response = await fetch(`http://localhost:3000/api/v1/tasks/${currentTask.id}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        console.log('🚫 Task cancelled via HTTP API');
        setCurrentTask(prev => prev ? { ...prev, status: 'cancelled', message: 'Task cancelled' } : null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to cancel task:', error);
      return false;
    }
  }, [currentTask, isConnected, wsCancel, apiKey]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear current task
  const clearTask = useCallback(() => {
    setCurrentTask(null);
    completedTasksRef.current.clear();
  }, []);

  return {
    // Task state
    currentTask,
    isSubmitting,
    error,
    
    // WebSocket state
    isConnected,
    connectionError,
    
    // Actions
    submitTask,
    cancelTask,
    clearError,
    clearTask,
    
    // Computed state
    isTaskRunning: currentTask?.status === 'in_progress' || currentTask?.status === 'pending',
    isTaskCompleted: currentTask?.status === 'completed',
    isTaskFailed: currentTask?.status === 'failed' || currentTask?.status === 'cancelled'
  };
};
