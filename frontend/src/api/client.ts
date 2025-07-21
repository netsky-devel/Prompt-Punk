import { API_BASE_URL, DEFAULT_SETTINGS } from '../constants';
import type { 
  ApiResponse, 
  CreateTaskRequest, 
  Task, 
  TaskStatus, 
  TaskResult, 
  RecentTask, 
  HealthCheck 
} from '../types/api';

// API Error Class
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string[]
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

// Retry utility
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// API Client Class
export class ApiClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  // Generic request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = DEFAULT_SETTINGS.MAX_RETRIES
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
    };

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new ApiClientError(
            errorData.error || `HTTP ${response.status}`,
            response.status,
            errorData.details
          );
        }

        return await response.json();
      } catch (error) {
        // If it's the last attempt or not a network error, throw
        if (attempt === retries || error instanceof ApiClientError) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        await delay(1000 * Math.pow(2, attempt));
      }
    }

    throw new ApiClientError('Max retries exceeded');
  }

  // Add API key header
  private addApiKey(apiKey: string) {
    return {
      'X-API-Key': apiKey,
    };
  }

  // Create Task
  async createTask(
    request: CreateTaskRequest, 
    apiKey: string
  ): Promise<ApiResponse<Task>> {
    return this.request('/tasks', {
      method: 'POST',
      headers: this.addApiKey(apiKey),
      body: JSON.stringify({ task: request }),
    });
  }

  // Get Task Status
  async getTaskStatus(taskId: number, apiKey: string): Promise<ApiResponse<TaskStatus>> {
    return this.request(`/tasks/${taskId}/status`, {
      headers: this.addApiKey(apiKey),
    });
  }

  // Get Task Result
  async getTaskResult(taskId: number, apiKey: string): Promise<ApiResponse<TaskResult>> {
    return this.request(`/tasks/${taskId}/result`, {
      headers: this.addApiKey(apiKey),
    });
  }

  // Get Recent Tasks
  async getRecentTasks(apiKey: string): Promise<ApiResponse<RecentTask[]>> {
    return this.request('/tasks/recent', {
      headers: this.addApiKey(apiKey),
    });
  }

  // Health Check
  async healthCheck(): Promise<ApiResponse<HealthCheck>> {
    return this.request('/health');
  }

  // Test API Key (create a simple task and delete it)
  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      // Try to get recent tasks as a simple API key test
      await this.getRecentTasks(apiKey);
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Singleton instance
export const apiClient = new ApiClient(); 