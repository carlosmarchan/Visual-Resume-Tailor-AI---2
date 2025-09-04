
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

  const AppliedChangeCard: React.FC<{change: ChangeDetail}> = ({ change }) => {
    const [isExpanded, setIsExpanded] = useState(false);
  
    return (
      <div className="bg-gray-900/70 p-4 rounded-lg border border-gray-700 transition-all duration-300">
        <div className="flex items-start space-x-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="flex-grow">
            <p className="font-semibold text-indigo-300">{change.section}</p>
            <p className="text-gray-300 text-sm">{change.summary}</p>
          </div>
           <div className="flex items-center space-x-2 pl-4 flex-shrink-0 text-green-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Applied</span>
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
                <TabButton tabId="changes">Applied Changes</TabButton>
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
                            <h3 className="text-xl font-bold text-white mb-3">Applied Changes</h3>
                            <div className="space-y-3">
                                {assets.changes.length > 0 ? (
                                    assets.changes.map((change, index) => (
                                        <AppliedChangeCard 
                                            key={`applied-${index}`} 
                                            change={change} 
                                        />
                                    ))
                                ) : (
                                    <div className="text-center text-gray-400 p-4 bg-gray-900/50 rounded-md border border-dashed border-gray-700">
                                        <p>No changes were applied to the original resume.</p>
                                    </div>
                                )}
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
