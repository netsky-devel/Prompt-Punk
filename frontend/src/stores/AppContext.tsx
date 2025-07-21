import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ProviderStorage } from '../utils/storage';
import { PROVIDERS, DEFAULT_MODELS } from '../constants';
import type { 
  ProviderSettings, 
  Task, 
  TaskResult, 
  RecentTask
} from '../types/api';

// State Shape
export interface AppState {
  // Provider Settings
  providerSettings: ProviderSettings | null;
  isProviderValid: boolean;

  // Current Task
  currentTask: Task | null;
  taskResult: TaskResult | null;
  isTaskLoading: boolean;

  // Recent Tasks
  recentTasks: RecentTask[];
  isRecentTasksLoading: boolean;

  // UI State
  errors: Record<string, string>;
  isInitialized: boolean;
}

// Initial State
const initialState: AppState = {
  providerSettings: null,
  isProviderValid: false,
  currentTask: null,
  taskResult: null,
  isTaskLoading: false,
  recentTasks: [],
  isRecentTasksLoading: false,
  errors: {},
  isInitialized: false,
};

// Action Types
export type AppAction =
  | { type: 'INITIALIZE_APP' }
  | { type: 'SET_PROVIDER_SETTINGS'; payload: ProviderSettings }
  | { type: 'SET_PROVIDER_VALIDITY'; payload: boolean }
  | { type: 'SET_CURRENT_TASK'; payload: Task | null }
  | { type: 'SET_TASK_RESULT'; payload: TaskResult | null }
  | { type: 'SET_TASK_LOADING'; payload: boolean }
  | { type: 'SET_RECENT_TASKS'; payload: RecentTask[] }
  | { type: 'SET_RECENT_TASKS_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: { key: string; message: string } }
  | { type: 'CLEAR_ERROR'; payload: string }
  | { type: 'CLEAR_ALL_ERRORS' }
  | { type: 'RESET_TASK_STATE' };

// Reducer
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'INITIALIZE_APP':
      return { ...state, isInitialized: true };

    case 'SET_PROVIDER_SETTINGS':
      return { 
        ...state, 
        providerSettings: action.payload,
        isProviderValid: false // Reset validity when settings change
      };

    case 'SET_PROVIDER_VALIDITY':
      return { ...state, isProviderValid: action.payload };

    case 'SET_CURRENT_TASK':
      return { ...state, currentTask: action.payload };

    case 'SET_TASK_RESULT':
      return { ...state, taskResult: action.payload };

    case 'SET_TASK_LOADING':
      return { ...state, isTaskLoading: action.payload };

    case 'SET_RECENT_TASKS':
      return { ...state, recentTasks: action.payload };

    case 'SET_RECENT_TASKS_LOADING':
      return { ...state, isRecentTasksLoading: action.payload };

    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.key]: action.payload.message }
      };

    case 'CLEAR_ERROR':
      const { [action.payload]: _, ...remainingErrors } = state.errors;
      return { ...state, errors: remainingErrors };

    case 'CLEAR_ALL_ERRORS':
      return { ...state, errors: {} };

    case 'RESET_TASK_STATE':
      return {
        ...state,
        currentTask: null,
        taskResult: null,
        isTaskLoading: false,
        errors: {}
      };

    default:
      return state;
  }
};

// Context Type
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Helper functions
  setProviderSettings: (settings: ProviderSettings) => void;
  setProviderValidity: (valid: boolean) => void;
  setError: (key: string, message: string) => void;
  clearError: (key: string) => void;
  clearAllErrors: () => void;
  resetTaskState: () => void;
}

// Create Context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Initialize app on mount
  useEffect(() => {
    const initializeApp = () => {
      try {
        // Load provider settings from localStorage
        const savedSettings = ProviderStorage.get();
        if (savedSettings) {
          dispatch({ type: 'SET_PROVIDER_SETTINGS', payload: savedSettings });
        } else {
          // Set default provider settings
          const defaultSettings: ProviderSettings = {
            provider: PROVIDERS.GOOGLE,
            ai_model: DEFAULT_MODELS[PROVIDERS.GOOGLE],
            api_key: '',
          };
          dispatch({ type: 'SET_PROVIDER_SETTINGS', payload: defaultSettings });
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      } finally {
        dispatch({ type: 'INITIALIZE_APP' });
      }
    };

    initializeApp();
  }, []);

  // Save provider settings to localStorage when they change
  useEffect(() => {
    if (state.providerSettings && state.isInitialized) {
      ProviderStorage.set(state.providerSettings);
    }
  }, [state.providerSettings, state.isInitialized]);

  // Helper functions
  const setProviderSettings = (settings: ProviderSettings) => {
    dispatch({ type: 'SET_PROVIDER_SETTINGS', payload: settings });
  };

  const setProviderValidity = (valid: boolean) => {
    dispatch({ type: 'SET_PROVIDER_VALIDITY', payload: valid });
  };

  const setError = (key: string, message: string) => {
    dispatch({ type: 'SET_ERROR', payload: { key, message } });
  };

  const clearError = (key: string) => {
    dispatch({ type: 'CLEAR_ERROR', payload: key });
  };

  const clearAllErrors = () => {
    dispatch({ type: 'CLEAR_ALL_ERRORS' });
  };

  const resetTaskState = () => {
    dispatch({ type: 'RESET_TASK_STATE' });
  };

  const contextValue: AppContextType = {
    state,
    dispatch,
    setProviderSettings,
    setProviderValidity,
    setError,
    clearError,
    clearAllErrors,
    resetTaskState,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 