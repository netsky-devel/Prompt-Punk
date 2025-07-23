import type {
  Task,
  TaskStatus,
  TaskResult,
  RecentTask,
  CreateTaskRequest,
  ApiResponse,
  Provider,
} from '../types/api';

const API_BASE_URL = 'http://localhost:3000/api/v1';

class ApiClient {
  private apiKey: string | null = null;

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add custom headers if provided
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          details: errorData.details,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Tasks API
  async createTask(request: CreateTaskRequest): Promise<ApiResponse<Task>> {
    return this.request<Task>('/tasks', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async getTask(taskId: number): Promise<ApiResponse<Task>> {
    return this.request<Task>(`/tasks/${taskId}`);
  }

  async getTaskStatus(taskId: number): Promise<ApiResponse<TaskStatus>> {
    return this.request<TaskStatus>(`/tasks/${taskId}/status`);
  }

  async getTaskResult(taskId: number): Promise<ApiResponse<TaskResult>> {
    return this.request<TaskResult>(`/tasks/${taskId}/result`);
  }

  async getRecentTasks(): Promise<ApiResponse<RecentTask[]>> {
    return this.request<RecentTask[]>('/tasks/recent');
  }

  async testApiKey(): Promise<ApiResponse<{ valid: boolean; provider: string }>> {
    return this.request<{ valid: boolean; provider: string }>('/tasks/test_api_key');
  }

  // Providers API
  async getProviders(): Promise<ApiResponse<Provider[]>> {
    return this.request<Provider[]>('/providers');
  }

  async testProviderConnection(provider: string): Promise<ApiResponse<{ connected: boolean }>> {
    return this.request<{ connected: boolean }>('/providers/test_connection', {
      method: 'POST',
      body: JSON.stringify({ provider }),
    });
  }
}

export const apiClient = new ApiClient();
