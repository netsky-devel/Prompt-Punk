import type { WebSocketMessage, WebSocketSubscription } from '../types/api';

const WEBSOCKET_URL = 'ws://localhost:3000/cable';

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private apiKey: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number | null = null;
  private isConnected = false;
  private subscriptions = new Set<string>();
  private messageHandlers = new Map<string, (message: WebSocketMessage) => void>();

  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        const url = this.apiKey 
          ? `${WEBSOCKET_URL}?api_key=${encodeURIComponent(this.apiKey)}`
          : WEBSOCKET_URL;
        
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('🔌 WebSocket connected');
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Resubscribe to all channels
          this.subscriptions.forEach(identifier => {
            this.subscribe(identifier);
          });
          
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 WebSocket message received:', data);

            // Handle ActionCable protocol messages
            if (data.type === 'ping') {
              return; // Ignore ping messages
            }

            if (data.type === 'welcome') {
              console.log('🎉 WebSocket connection established');
              return;
            }

            if (data.type === 'confirm_subscription') {
              console.log('✅ WebSocket subscription confirmed:', data.identifier);
              return;
            }

            // Handle task update messages
            if (data.message) {
              const message = data.message as WebSocketMessage;
              this.handleMessage(message);
            }
          } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected:', event.code, event.reason);
          this.isConnected = false;
          this.ws = null;

          // Attempt to reconnect if not a manual disconnect
          if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`🔄 Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);
            
            this.reconnectTimeout = setTimeout(() => {
              this.reconnectAttempts++;
              this.connect().catch(console.error);
            }, delay);
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          reject(error);
        };

      } catch (error) {
        console.error('❌ Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }

    this.isConnected = false;
    this.subscriptions.clear();
    this.messageHandlers.clear();
  }

  subscribeToTask(taskId: number, onMessage: (message: WebSocketMessage) => void) {
    const identifier = JSON.stringify({
      channel: 'TaskChannel',
      task_id: taskId.toString()
    });

    this.messageHandlers.set(`task_${taskId}`, onMessage);
    this.subscriptions.add(identifier);

    if (this.isConnected) {
      this.subscribe(identifier);
    }
  }

  unsubscribeFromTask(taskId: number) {
    const identifier = JSON.stringify({
      channel: 'TaskChannel',
      task_id: taskId.toString()
    });

    this.messageHandlers.delete(`task_${taskId}`);
    this.subscriptions.delete(identifier);

    if (this.isConnected) {
      this.unsubscribe(identifier);
    }
  }

  cancelTask(taskId: number) {
    if (!this.isConnected || !this.ws) {
      console.error('❌ WebSocket not connected, cannot cancel task');
      return;
    }

    const message = {
      command: 'message',
      identifier: JSON.stringify({
        channel: 'TaskChannel',
        task_id: taskId.toString()
      }),
      data: JSON.stringify({
        action: 'cancel_task',
        task_id: taskId
      })
    };

    this.ws.send(JSON.stringify(message));
    console.log('🚫 Sent task cancellation request:', taskId);
  }

  private subscribe(identifier: string) {
    if (!this.ws || !this.isConnected) return;

    const subscription: WebSocketSubscription = {
      command: 'subscribe',
      identifier
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('📡 Subscribed to channel:', identifier);
  }

  private unsubscribe(identifier: string) {
    if (!this.ws || !this.isConnected) return;

    const subscription: WebSocketSubscription = {
      command: 'unsubscribe',
      identifier
    };

    this.ws.send(JSON.stringify(subscription));
    console.log('📡 Unsubscribed from channel:', identifier);
  }

  private handleMessage(message: WebSocketMessage) {
    if (!message.task_id) return;

    const handler = this.messageHandlers.get(`task_${message.task_id}`);
    if (handler) {
      handler(message);
    }
  }

  get connected() {
    return this.isConnected;
  }
}

export const websocketClient = new WebSocketClient();
