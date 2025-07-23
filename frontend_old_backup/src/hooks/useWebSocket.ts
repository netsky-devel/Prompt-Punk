import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  task_id?: string;
  status?: string;
  progress?: number;
  message?: string;
  step?: string;
  error?: string;
}

interface UseWebSocketOptions {
  apiKey: string;
  taskId?: string;
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export const useWebSocket = (options: UseWebSocketOptions) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const { apiKey, taskId, onMessage, onError, onConnect, onDisconnect } = options;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      // Build WebSocket URL with API key authentication
      const wsUrl = `ws://localhost:3000/cable?api_key=${encodeURIComponent(apiKey)}`;
      console.log('🔌 Connecting to WebSocket:', wsUrl);

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        onConnect?.();

        // Subscribe to TaskChannel
        const subscribeMessage = {
          command: 'subscribe',
          identifier: JSON.stringify({
            channel: 'TaskChannel',
            task_id: taskId
          })
        };

        ws.send(JSON.stringify(subscribeMessage));
        console.log('📡 Subscribed to TaskChannel', taskId ? `for task ${taskId}` : 'for all tasks');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);

          // Handle ActionCable protocol messages
          if (data.type === 'ping') {
            return; // Ignore ping messages
          }

          if (data.type === 'welcome') {
            console.log('🎉 WebSocket welcome received');
            return;
          }

          if (data.type === 'confirm_subscription') {
            console.log('✅ TaskChannel subscription confirmed');
            return;
          }

          // Handle task update messages
          if (data.message) {
            onMessage?.(data.message);
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        wsRef.current = null;
        onDisconnect?.();

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
          console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${reconnectAttempts.current + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            connect();
          }, delay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setConnectionError('Failed to reconnect after multiple attempts');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setConnectionError('WebSocket connection error');
        onError?.(error);
      };

    } catch (error) {
      console.error('❌ Failed to create WebSocket connection:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [apiKey, taskId, onMessage, onError, onConnect, onDisconnect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    return false;
  }, []);

  // Cancel task via WebSocket
  const cancelTask = useCallback((taskId: string) => {
    const message = {
      command: 'message',
      identifier: JSON.stringify({
        channel: 'TaskChannel',
        task_id: taskId
      }),
      data: JSON.stringify({
        action: 'cancel_task',
        task_id: taskId
      })
    };

    return sendMessage(message);
  }, [sendMessage]);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    console.log('🔍 useWebSocket useEffect triggered:', { apiKey: apiKey ? 'present' : 'missing', taskId });
    if (apiKey) {
      console.log('🔌 Attempting WebSocket connection...');
      connect();
    } else {
      console.log('❌ No API key provided, WebSocket not connecting');
    }

    return () => {
      disconnect();
    };
  }, [apiKey, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect,
    sendMessage,
    cancelTask
  };
};
