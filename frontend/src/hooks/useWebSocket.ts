import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketClient } from '../services/websocket';
import type { WebSocketMessage, Task } from '../types/api';

interface UseWebSocketOptions {
  apiKey?: string;
  autoConnect?: boolean;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { apiKey, autoConnect = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!apiKey || !autoConnect) return;

    websocketClient.setApiKey(apiKey);
    
    const connect = async () => {
      try {
        await websocketClient.connect();
        setIsConnected(true);
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        setConnectionError('Failed to connect to WebSocket');
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      websocketClient.disconnect();
      setIsConnected(false);
    };
  }, [apiKey, autoConnect]);

  // Monitor connection status
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(websocketClient.connected);
    };

    const interval = setInterval(checkConnection, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = useCallback(async () => {
    if (!apiKey) {
      setConnectionError('API key is required');
      return;
    }

    try {
      websocketClient.setApiKey(apiKey);
      await websocketClient.connect();
      setIsConnected(true);
      setConnectionError(null);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setConnectionError('Failed to connect to WebSocket');
      setIsConnected(false);
    }
  }, [apiKey]);

  const disconnect = useCallback(() => {
    websocketClient.disconnect();
    setIsConnected(false);
  }, []);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
  };
}

interface UseTaskWebSocketOptions {
  taskId?: number;
  onProgress?: (message: WebSocketMessage) => void;
  onCompleted?: (message: WebSocketMessage) => void;
  onFailed?: (message: WebSocketMessage) => void;
}

export function useTaskWebSocket(options: UseTaskWebSocketOptions = {}) {
  const { taskId, onProgress, onCompleted, onFailed } = options;
  const [taskStatus, setTaskStatus] = useState<Task['status'] | null>(null);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (!taskId) return;

    const handleMessage = (wsMessage: WebSocketMessage) => {
      console.log('📨 Task WebSocket message:', wsMessage);

      // Update local state
      if (wsMessage.status) {
        setTaskStatus(wsMessage.status);
      }
      if (typeof wsMessage.progress === 'number') {
        setProgress(wsMessage.progress);
      }
      if (wsMessage.message) {
        setMessage(wsMessage.message);
      }

      // Call appropriate callback
      switch (wsMessage.type) {
        case 'task_progress':
          onProgress?.(wsMessage);
          break;
        case 'task_completed':
          onCompleted?.(wsMessage);
          break;
        case 'task_failed':
          onFailed?.(wsMessage);
          break;
      }
    };

    websocketClient.subscribeToTask(taskId, handleMessage);

    return () => {
      websocketClient.unsubscribeFromTask(taskId);
    };
  }, [taskId, onProgress, onCompleted, onFailed]);

  const cancelTask = useCallback(() => {
    if (taskId) {
      websocketClient.cancelTask(taskId);
    }
  }, [taskId]);

  return {
    taskStatus,
    progress,
    message,
    cancelTask,
  };
}
