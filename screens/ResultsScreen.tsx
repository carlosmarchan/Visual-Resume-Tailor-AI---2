import React, { useState, useCallback } from 'react';
import { GeneratedAssets, JobDetails, ChangeDetail } from '../types';
import Button from '../components/Button';
import { usePdfGenerator } from '../hooks/usePdfGenerator';

interface ResultsScreenProps {
  assets: GeneratedAssets;
  jobDetails: JobDetails | null;
  originalResumeImages: string[];
}

type ActiveTab = 'resume' | 'coverLetter' | 'changes' | 'originalText' | 'newText';

const ResultsScreen: React.FC<ResultsScreenProps> = ({ assets, jobDetails, originalResumeImages }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resume');
  const [copied, setCopied] = useState<'original' | 'new' | false>(false);
  const { downloadImagesAsPdf, downloadTextAsPdf } = usePdfGenerator();
  
  // Initialize the state of applied changes from the assets
  const [appliedChanges, setAppliedChanges] = useState<Record<string, boolean>>(
    () => Object.fromEntries(assets.changes.map((c, i) => [`change-${i}`, true]))
  );

  const handleToggleChange = (changeId: string) => {
    setAppliedChanges(prev => ({ ...prev, [changeId]: !prev[changeId] }));
  };


  const handleCopyToClipboard = useCallback((textToCopy: string, type: 'original' | 'new') => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  const handleDownloadResume = () => {
    const fileName = `${jobDetails?.companyName}_${jobDetails?.jobTitle}_Resume.pdf`.replace(/\s/g, '_');
    downloadImagesAsPdf(assets.tailoredResumeImages, fileName);
  };
  
  const handleDownloadCoverLetter = () => {
    const fileName = `${jobDetails?.companyName}_${jobDetails?.jobTitle}_CoverLetter.pdf`.replace(/\s/g, '_');
    downloadTextAsPdf(assets.coverLetter, fileName);
  };

  const TabButton: React.FC<{tabId: ActiveTab; children: React.ReactNode}> = ({tabId, children}) => (
    <button
        onClick={() => setActiveTab(tabId)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
            activeTab === tabId ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-700'
        }`}
    >
        {children}
    </button>
  );

  const ChangeCard: React.FC<{change: ChangeDetail, id: string, isApplied: boolean, onToggle: () => void}> = ({ change, id, isApplied, onToggle }) => (
    <div className="bg-gray-900 p-4 rounded-md border border-gray-700 flex items-start space-x-4">
      <div className="flex-grow">
        <p className="font-semibold text-indigo-300">{change.section}</p>
        <p className="text-gray-300 text-sm">{change.summary}</p>
      </div>
      <div className="flex items-center space-x-3 pl-4 flex-shrink-0">
         <span className={`text-xs font-medium ${isApplied ? 'text-gray-300' : 'text-gray-500'}`}>Apply Change</span>
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
  );


  return (
    <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800/50 p-6 sm:p-8 rounded-lg shadow-2xl border border-gray-700">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6 pb-6 border-b border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold text-white">Your Tailored Documents are Ready</h2>
                    <p className="text-gray-400">Application for {jobDetails?.jobTitle} at {jobDetails?.companyName}</p>
                </div>
            </div>

            <div className="flex flex-wrap gap-2 border-b border-gray-700 mb-6 pb-4">
                <TabButton tabId="resume">Tailored Resume</TabButton>
                <TabButton tabId="coverLetter">Cover Letter</TabButton>
                <TabButton tabId="changes">Review &amp; Refine</TabButton>
                <TabButton tabId="originalText">Original Resume Text</TabButton>
                <TabButton tabId="newText">New Resume Text</TabButton>
            </div>
            
            <div className="min-h-[60vh]">
                {activeTab === 'resume' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleDownloadResume}>Download Tailored Resume (PDF)</Button>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 text-center sticky top-[88px] bg-gray-800/80 backdrop-blur-sm py-2 z-10 rounded-md">Original Resume</h3>
                                <div className="space-y-8">
                                    {originalResumeImages.map((src, index) => (
                                        <div key={`orig-${index}`} className="aspect-[8.5/11] border border-gray-600 rounded-md overflow-hidden shadow-lg mx-auto max-w-full bg-white">
                                            <img src={src} alt={`Original Resume Page ${index + 1}`} className="object-contain w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-white mb-4 text-center sticky top-[88px] bg-gray-800/80 backdrop-blur-sm py-2 z-10 rounded-md">Tailored Resume</h3>
                                <div className="space-y-8">
                                    {assets.tailoredResumeImages.map((src, index) => (
                                        <div key={`tailored-${index}`} className="aspect-[8.5/11] border border-gray-600 rounded-md overflow-hidden shadow-lg mx-auto max-w-full bg-white">
                                            <img src={src} alt={`Tailored Resume Page ${index + 1}`} className="object-contain w-full h-full" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'coverLetter' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleDownloadCoverLetter}>Download Cover Letter (PDF)</Button>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-md border border-gray-600">
                            <pre className="whitespace-pre-wrap font-sans text-gray-200">{assets.coverLetter}</pre>
                        </div>
                    </div>
                )}
                {activeTab === 'changes' && (
                     <div className="space-y-8 text-gray-200 max-w-4xl mx-auto">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">Executive Summary</h3>
                            <p className="bg-gray-900 p-4 rounded-md border border-gray-600 whitespace-pre-wrap font-sans">
                                {assets.summary}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">Refine Changes</h3>
                            <div className="space-y-3">
                                {assets.changes.map((change, index) => {
                                    const id = `change-${index}`;
                                    return (
                                        <ChangeCard 
                                            key={id} 
                                            id={id} 
                                            change={change} 
                                            isApplied={appliedChanges[id]} 
                                            onToggle={() => handleToggleChange(id)} 
                                        />
                                    );
                                })}
                            </div>
                             <div className="mt-6 text-center text-sm text-gray-400 p-4 bg-gray-900/50 rounded-md border border-dashed border-gray-700">
                                <p className="font-semibold text-gray-300 mb-1">Next Up: Real-Time Updates!</p>
                                <p>Soon, toggling these changes will instantly update the tailored resume preview.</p>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">ATS Keywords Added</h3>
                            <div className="flex flex-wrap gap-2 bg-gray-900 p-4 rounded-md border border-gray-600">
                                {assets.atsKeywords.map((keyword, index) => (
                                    <span key={index} className="bg-indigo-900/50 text-indigo-300 text-sm font-medium px-2.5 py-0.5 rounded-full border border-indigo-700">
                                        {keyword}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'originalText' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => handleCopyToClipboard(assets.originalResumeText, 'original')}>{copied === 'original' ? 'Copied!' : 'Copy Text'}</Button>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-md border border-gray-600">
                            <p className="text-sm text-gray-400 mb-4">This is the text transcribed from your original resume, useful for pasting into online application forms.</p>
                            <pre className="whitespace-pre-wrap font-sans text-gray-200">{assets.originalResumeText}</pre>
                        </div>
                    </div>
                )}
                {activeTab === 'newText' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={() => handleCopyToClipboard(assets.rewrittenResumeText, 'new')}>{copied === 'new' ? 'Copied!' : 'Copy Text'}</Button>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-md border border-gray-600">
                            <p className="text-sm text-gray-400 mb-4">This is the new tailored text generated for your resume, useful for pasting into online application forms.</p>
                            <pre className="whitespace-pre-wrap font-sans text-gray-200">{assets.rewrittenResumeText}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ResultsScreen;