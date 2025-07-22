import React from 'react';

interface ErrorDisplayProps {
  error: string;
  onDismiss: () => void;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-center">
        <span className="text-red-500 mr-2">❌</span>
        <span className="text-red-800 font-medium">Error</span>
      </div>
      <p className="text-red-700 mt-1">{error}</p>
      <button 
        onClick={onDismiss}
        className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
      >
        Dismiss
      </button>
    </div>
  );
};
