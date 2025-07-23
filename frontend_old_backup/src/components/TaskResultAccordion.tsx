import React, { useState } from 'react';
import { TaskResult } from '../types/api';

// Simple markdown renderer for basic formatting
const renderMarkdown = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by lines and process each line
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Headers
    if (line.startsWith('## ')) {
      elements.push(
        <h3 key={i} className="text-lg font-semibold text-gray-800 mt-4 mb-2">
          {line.substring(3)}
        </h3>
      );
    } else if (line.startsWith('# ')) {
      elements.push(
        <h2 key={i} className="text-xl font-bold text-gray-800 mt-4 mb-2">
          {line.substring(2)}
        </h2>
      );
    }
    // Bold text
    else if (line.includes('**')) {
      const parts = line.split('**');
      const formattedLine = parts.map((part, index) => 
        index % 2 === 1 ? <strong key={index} className="font-semibold">{part}</strong> : part
      );
      elements.push(<p key={i} className="mb-2">{formattedLine}</p>);
    }
    // Bullet points
    else if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
      elements.push(
        <li key={i} className="ml-4 mb-1 text-gray-700">
          {line.trim().substring(2)}
        </li>
      );
    }
    // Numbered lists
    else if (/^\d+\.\s/.test(line.trim())) {
      elements.push(
        <li key={i} className="ml-4 mb-1 text-gray-700 list-decimal">
          {line.trim().replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    // Empty lines
    else if (line.trim() === '') {
      elements.push(<br key={i} />);
    }
    // Regular paragraphs
    else if (line.trim()) {
      // Handle inline bold in regular text
      if (line.includes('**')) {
        const parts = line.split('**');
        const formattedLine = parts.map((part, index) => 
          index % 2 === 1 ? <strong key={index} className="font-semibold">{part}</strong> : part
        );
        elements.push(<p key={i} className="mb-2 text-gray-700 leading-relaxed">{formattedLine}</p>);
      } else {
        elements.push(<p key={i} className="mb-2 text-gray-700 leading-relaxed">{line}</p>);
      }
    }
  }
  
  return <div>{elements}</div>;
};

interface TaskResultAccordionProps {
  taskResult: TaskResult;
}

export const TaskResultAccordion: React.FC<TaskResultAccordionProps> = ({ taskResult }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const AccordionSection: React.FC<{
    id: string;
    title: string;
    icon: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
  }> = ({ id, title, icon, children, defaultExpanded = false }) => {
    const isExpanded = expandedSections.has(id) || (expandedSections.size === 0 && defaultExpanded);

    return (
      <div className="border border-gray-200 rounded-lg mb-3">
        <button
          onClick={() => toggleSection(id)}
          className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg transition-colors"
        >
          <span className="flex items-center gap-2 font-medium text-gray-800">
            <span>{icon}</span>
            {title}
          </span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>
        {isExpanded && (
          <div className="px-4 py-3 bg-white border-t border-gray-200 rounded-b-lg">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {/* Task Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-800">Task #{taskResult.task.task_id}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Quality Score:</span>
            <span className="font-bold text-lg text-green-600">
              {taskResult.improvement.quality_score}/10 {taskResult.improvement.quality_emoji}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div><span className="font-medium">Type:</span> {taskResult.task.improvement_type}</div>
          <div><span className="font-medium">Architecture:</span> {taskResult.task.architecture}</div>
          <div><span className="font-medium">Provider:</span> {taskResult.task.provider}</div>
          <div><span className="font-medium">Model:</span> {taskResult.task.ai_model}</div>
        </div>
      </div>

      {/* Improved Prompt - Default Expanded */}
      <AccordionSection id="improved" title="Improved Prompt" icon="✨" defaultExpanded={true}>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-gray-800 leading-relaxed">
            {renderMarkdown(taskResult.improvement.improved_prompt)}
          </div>
          <div className="mt-3 pt-3 border-t border-green-200">
            <button
              onClick={() => navigator.clipboard.writeText(taskResult.improvement.improved_prompt)}
              className="btn btn-sm btn-primary"
            >
              📋 Copy Improved Prompt
            </button>
          </div>
        </div>
      </AccordionSection>

      {/* Analysis */}
      {taskResult.improvement.analysis && (
        <AccordionSection id="analysis" title="Analysis" icon="🔍">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Main Goal</h4>
              <p className="text-gray-600 bg-blue-50 rounded-lg p-3">
                {taskResult.improvement.analysis.main_goal}
              </p>
            </div>
            
            {taskResult.improvement.analysis.identified_problems && 
             taskResult.improvement.analysis.identified_problems.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Identified Problems</h4>
                <ul className="space-y-2">
                  {taskResult.improvement.analysis.identified_problems.map((problem, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span className="text-gray-600 bg-red-50 rounded-lg p-2 flex-1">{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Improvement Potential</h4>
              <p className="text-gray-600 bg-green-50 rounded-lg p-3">
                {taskResult.improvement.analysis.improvement_potential}
              </p>
            </div>

            {taskResult.improvement.analysis.missing_elements && (
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Missing Elements</h4>
                <p className="text-gray-600 bg-yellow-50 rounded-lg p-3">
                  {taskResult.improvement.analysis.missing_elements}
                </p>
              </div>
            )}
          </div>
        </AccordionSection>
      )}

      {/* Applied Techniques */}
      {taskResult.improvement.improvements_metadata?.applied_techniques && (
        <AccordionSection id="techniques" title="Applied Techniques" icon="🛠️">
          <div className="space-y-3">
            {taskResult.improvement.improvements_metadata.applied_techniques.map((technique, index) => (
              <div key={index} className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <div className="font-medium text-purple-800 mb-1">{technique.name}</div>
                <p className="text-purple-600 text-sm mb-2">{technique.description}</p>
                <p className="text-purple-500 text-xs">Expected: {technique.expected_effect}</p>
              </div>
            ))}
          </div>
        </AccordionSection>
      )}

      {/* Original Prompt */}
      <AccordionSection id="original" title="Original Prompt" icon="📝">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
            {taskResult.task.original_prompt}
          </p>
        </div>
      </AccordionSection>
    </div>
  );
};
