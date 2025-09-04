
import React, { useState, useMemo } from 'react';
import { TextGenerationResult, ChangeDetail } from '../types';
import Button from '../components/Button';

// Placeholder cost for nano-banana image generation
const COST_PER_IMAGE_GENERATION = 0.025; // $0.025 per image

interface RefinementScreenProps {
  textAssets: TextGenerationResult;
  onConfirm: (appliedChanges: ChangeDetail[]) => void;
}

const ChangeCard: React.FC<{change: ChangeDetail, isApplied: boolean, onToggle: () => void}> = ({ change, isApplied, onToggle }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 transition-all duration-300">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex-grow cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <p className="font-semibold text-indigo-300">{change.section}</p>
            <p className="text-gray-300 text-sm">{change.summary}</p>
          </div>
          <div className="flex items-center space-x-3 pl-4 flex-shrink-0">
             <span className={`text-xs font-medium ${isApplied ? 'text-gray-300' : 'text-gray-500'}`}>Apply</span>
             <button
                type="button"
                onClick={onToggle}
                className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 ${isApplied ? 'bg-indigo-600' : 'bg-gray-600'}`}
                role="switch"
                aria-checked={isApplied}
            >
                <span
                    aria-hidden="true"
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${isApplied ? 'translate-x-5' : 'translate-x-0'}`}
                ></span>
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-700/50 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                  <h4 className="font-bold text-gray-400 mb-2">Original</h4>
                  <div className="bg-gray-800 p-3 rounded-md border border-gray-600 h-full">
                      <pre className="whitespace-pre-wrap font-sans text-gray-300">
                          {change.originalText || <span className="text-gray-500 italic">No original text (new section).</span>}
                      </pre>
                  </div>
              </div>
              <div>
                  <h4 className="font-bold text-green-400 mb-2">Tailored</h4>
                   <div className="bg-gray-800 p-3 rounded-md border border-green-700/50 h-full">
                      <pre className="whitespace-pre-wrap font-sans text-green-200">{change.newText}</pre>
                  </div>
              </div>
          </div>
        )}
      </div>
    );
};

const RefinementScreen: React.FC<RefinementScreenProps> = ({ textAssets, onConfirm }) => {
    const initialAppliedState = useMemo(() => {
        return Object.fromEntries(textAssets.changes.map((_, i) => [`change-${i}`, true]))
    }, [textAssets.changes]);

    const [appliedChangesMap, setAppliedChangesMap] = useState<Record<string, boolean>>(initialAppliedState);

    const groupedChanges = useMemo(() => {
        return textAssets.changes.reduce((acc, change, index) => {
            const key = change.section;
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({ ...change, id: `change-${index}` });
            return acc;
        }, {} as Record<string, (ChangeDetail & { id: string })[]>);
    }, [textAssets.changes]);

    const handleToggleChange = (changeId: string) => {
        setAppliedChangesMap(prev => ({ ...prev, [changeId]: !prev[changeId] }));
    };
    
    const handleBulkChange = (sectionKey: string, apply: boolean) => {
        const changesToUpdate = groupedChanges[sectionKey].reduce((acc, change) => {
            acc[change.id] = apply;
            return acc;
        }, {} as Record<string, boolean>);
        setAppliedChangesMap(prev => ({ ...prev, ...changesToUpdate }));
    };

    const handleSubmit = () => {
        const appliedChangesList = textAssets.changes.filter((_, index) => appliedChangesMap[`change-${index}`]);
        onConfirm(appliedChangesList);
    };

    const { pagesToRegenerate, estimatedCost, totalTokens } = useMemo(() => {
        const appliedChangesList = textAssets.changes.filter((_, index) => appliedChangesMap[`change-${index}`]);
        const pages = new Set(appliedChangesList.map(c => c.pageIndex));
        
        // Approx token count, good enough for estimation. 4 chars ~= 1 token
        const tokens = Math.round(appliedChangesList.reduce((sum, change) => sum + change.newText.length, 0) / 4);

        return {
            pagesToRegenerate: pages.size,
            estimatedCost: pages.size * COST_PER_IMAGE_GENERATION,
            totalTokens: tokens,
        };
    }, [appliedChangesMap, textAssets.changes]);

    const hasChangesToApply = pagesToRegenerate > 0;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Refine & Approve Changes</h2>
                <p className="text-gray-400 mt-2">Select the changes you want to apply before the final visual resume is generated.</p>
            </div>
            
            <div className="space-y-6">
                {Object.entries(groupedChanges).map(([section, changes]) => (
                    <div key={section} className="bg-gray-800/50 p-6 rounded-lg shadow-lg border border-gray-700">
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-700">
                            <h3 className="text-lg font-semibold text-white">{section}</h3>
                            <div className="flex space-x-2">
                                <button onClick={() => handleBulkChange(section, true)} className="text-xs font-medium text-indigo-400 hover:text-white">Accept All</button>
                                <span className="text-gray-600">|</span>
                                <button onClick={() => handleBulkChange(section, false)} className="text-xs font-medium text-gray-500 hover:text-white">Reject All</button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {changes.map(change => (
                                <ChangeCard 
                                    key={change.id}
                                    change={change}
                                    isApplied={appliedChangesMap[change.id]}
                                    onToggle={() => handleToggleChange(change.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sticky bottom-4 z-10 bg-gray-900/80 backdrop-blur-sm border border-indigo-500/30 rounded-lg p-4 shadow-2xl max-w-2xl mx-auto">
                <div className="flex justify-around items-center text-center">
                    <div>
                        <p className="text-xs text-gray-400">Pages to Regenerate</p>
                        <p className="text-xl font-bold text-white">{pagesToRegenerate}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Input Tokens (Approx.)</p>
                        <p className="text-xl font-bold text-white">{totalTokens.toLocaleString()}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-400">Estimated Cost</p>
                        <p className="text-xl font-bold text-green-400">${estimatedCost.toFixed(3)}</p>
                    </div>
                    <div className="pl-4">
                         <Button onClick={handleSubmit} variant="primary">
                            {hasChangesToApply ? 'Generate Visual Resume' : 'Finalize & View Documents'}
                        </Button>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default RefinementScreen;
