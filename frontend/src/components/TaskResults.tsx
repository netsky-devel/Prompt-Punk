import { useState, useEffect } from 'react';
import { Copy, Users, ChevronDown, ChevronUp, RefreshCw, CheckCircle } from 'lucide-react';
import { useApi } from '../hooks/useApi';
import type { Task, TaskResult } from '../types/api';

interface TaskResultsProps {
  task: Task;
  onReset: () => void;
}

export function TaskResults({ task, onReset }: TaskResultsProps) {
  const [result, setResult] = useState<TaskResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showOriginal, setShowOriginal] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [copiedImproved, setCopiedImproved] = useState(false);
  const [copiedOriginal, setCopiedOriginal] = useState(false);

  const { getTaskResult } = useApi();

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);
      const taskResult = await getTaskResult(task.task_id);
      if (taskResult) {
        setResult(taskResult);
      }
      setIsLoading(false);
    };

    fetchResult();
  }, [task.task_id, getTaskResult]);

  const copyToClipboard = async (text: string, type: 'improved' | 'original') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'improved') {
        setCopiedImproved(true);
        setTimeout(() => setCopiedImproved(false), 2000);
      } else {
        setCopiedOriginal(true);
        setTimeout(() => setCopiedOriginal(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };



  if (isLoading) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-8">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-dark-400">Loading results...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-8">
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">Failed to load task results</p>
          <button
            onClick={onReset}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Create New Task
          </button>
        </div>
      </div>
    );
  }

  const { improvement, session } = result;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-lg">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Task Completed
              </h2>
              <p className="text-dark-400 text-sm">
                Your prompt has been improved by AI agents
              </p>
            </div>
          </div>
          
          <button
            onClick={onReset}
            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium py-2 px-4 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>

        {/* Task Stats */}
        {(improvement || session) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-dark-800">
            {improvement && (
              <>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {improvement.formatted_processing_time}
                  </div>
                  <div className="text-xs text-dark-400">Processing Time</div>
                </div>
              </>
            )}
            
            {session && (
              <>
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {session.rounds_completed}
                  </div>
                  <div className="text-xs text-dark-400">Rounds Completed</div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-bold text-white">
                    {session.feedback_count}
                  </div>
                  <div className="text-xs text-dark-400">Feedback Items</div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Improved Prompt */}
      {improvement && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Improved Prompt</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => copyToClipboard(improvement.improved_prompt, 'improved')}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                title="Copy improved prompt"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
            <p className="text-white leading-relaxed whitespace-pre-wrap">
              {improvement.improved_prompt}
            </p>
          </div>
          
          {copiedImproved && (
            <p className="text-green-400 text-sm mt-2">✓ Copied to clipboard!</p>
          )}
        </div>
      )}

      {/* Original Prompt (Collapsible) */}
      <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
        <button
          onClick={() => setShowOriginal(!showOriginal)}
          className="flex items-center justify-between w-full text-left"
        >
          <h3 className="text-lg font-semibold text-white">Original Prompt</h3>
          <div className="flex items-center space-x-2">
            {showOriginal && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  copyToClipboard(task.original_prompt, 'original');
                }}
                className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
                title="Copy original prompt"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            {showOriginal ? (
              <ChevronUp className="w-5 h-5 text-dark-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-dark-400" />
            )}
          </div>
        </button>
        
        {showOriginal && (
          <div className="mt-4">
            <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
              <p className="text-dark-300 leading-relaxed">
                {task.original_prompt}
              </p>
            </div>
            {copiedOriginal && (
              <p className="text-green-400 text-sm mt-2">✓ Copied to clipboard!</p>
            )}
          </div>
        )}
      </div>

      {/* Analysis (Collapsible) */}
      {improvement?.analysis && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <button
            onClick={() => setShowAnalysis(!showAnalysis)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-white">Analysis</h3>
            {showAnalysis ? (
              <ChevronUp className="w-5 h-5 text-dark-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-dark-400" />
            )}
          </button>
          
          {showAnalysis && (
            <div className="space-y-4">
              {Object.entries(improvement.analysis).map(([key, value]) => (
                <div key={key} className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                  <h4 className="text-sm font-medium text-purple-400 mb-2 capitalize">
                    {key.replace(/_/g, ' ')}
                  </h4>
                  <p className="text-dark-300 text-sm leading-relaxed">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Feedback History (Collapsible) */}
      {session?.feedback_history && session.feedback_history.length > 0 && (
        <div className="bg-dark-900 rounded-xl border border-dark-800 p-6">
          <button
            onClick={() => setShowFeedback(!showFeedback)}
            className="flex items-center justify-between w-full text-left mb-4"
          >
            <h3 className="text-lg font-semibold text-white">
              Feedback History ({session.feedback_count})
            </h3>
            {showFeedback ? (
              <ChevronUp className="w-5 h-5 text-dark-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-dark-400" />
            )}
          </button>
          
          {showFeedback && (
            <div className="space-y-3">
              {session.feedback_history.map((feedback, index) => (
                <div key={index} className="bg-dark-800 rounded-lg p-4 border border-dark-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-purple-400 font-medium">
                      Round {index + 1}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Users className="w-3 h-3 text-dark-400" />
                      <span className="text-xs text-dark-400">Multi-Agent</span>
                    </div>
                  </div>
                  <p className="text-dark-300 text-sm leading-relaxed">
                    {typeof feedback === 'string' ? feedback : JSON.stringify(feedback, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
