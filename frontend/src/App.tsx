import { useState, useEffect } from 'react';
import { apiClient } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { Header } from './components/Header';
import { ApiKeySetup } from './components/ApiKeySetup';
import { TaskCreator } from './components/TaskCreator';
import { TaskProgress } from './components/TaskProgress';
import { TaskResults } from './components/TaskResults';
import { RecentTasks } from './components/RecentTasks';
import type { Task } from './types/api';

function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [recentTasksKey, setRecentTasksKey] = useState(0);

  const { isConnected, connectionError } = useWebSocket({
    apiKey: apiKey || undefined,
    autoConnect: !!apiKey,
  });

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedApiKey = localStorage.getItem('prompt-punk-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      apiClient.setApiKey(savedApiKey);
    }
  }, []);

  // Validate API key when it changes
  useEffect(() => {
    if (!apiKey) {
      setIsApiKeyValid(false);
      return;
    }

    const validateApiKey = async () => {
      try {
        const response = await apiClient.testApiKey();
        const isValid = response.success && response.data?.valid === true;
        setIsApiKeyValid(isValid);
      } catch (error) {
        console.error('Failed to validate API key:', error);
        setIsApiKeyValid(false);
      }
    };

    validateApiKey();
  }, [apiKey]);

  const handleApiKeySubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    apiClient.setApiKey(newApiKey);
    localStorage.setItem('prompt-punk-api-key', newApiKey);
  };

  const handleTaskCreated = (task: Task) => {
    setCurrentTask(task);
    setShowResults(false);
  };

  const handleTaskCompleted = () => {
    setShowResults(true);
    setRecentTasksKey(prev => prev + 1); // Refresh recent tasks
  };

  const handleTaskReset = () => {
    setCurrentTask(null);
    setShowResults(false);
  };

  const handleTaskClick = async (taskId: number) => {
    try {
      // Load task details
      const taskResponse = await apiClient.getTask(taskId);
      if (taskResponse.success && taskResponse.data) {
        setCurrentTask(taskResponse.data);
        setShowResults(true);
      } else {
        console.error('Failed to load task:', taskResponse.error);
      }
    } catch (error) {
      console.error('Error loading task results:', error);
    }
  };
  
  return (
    <div className="min-h-screen bg-dark-950">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {!isApiKeyValid ? (
          <div className="max-w-md mx-auto">
            <ApiKeySetup 
              onApiKeySubmit={handleApiKeySubmit} 
              initialApiKey={apiKey}
            />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Connection Status */}
            {connectionError && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-red-400 text-sm">
                    WebSocket connection error: {connectionError}
                  </span>
                </div>
              </div>
            )}
            
            {isConnected && (
              <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-green-400 text-sm">
                    Connected to real-time updates
                  </span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {!currentTask ? (
                  <TaskCreator onTaskCreated={handleTaskCreated} />
                ) : (
                  <>
                    {!showResults ? (
                      <TaskProgress 
                        task={currentTask} 
                        onCompleted={handleTaskCompleted}
                        onReset={handleTaskReset}
                      />
                    ) : (
                      <TaskResults 
                        task={currentTask} 
                        onReset={handleTaskReset}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <RecentTasks key={recentTasksKey} onTaskClick={handleTaskClick} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
