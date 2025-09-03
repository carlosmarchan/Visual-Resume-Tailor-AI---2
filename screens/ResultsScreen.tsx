
import React, { useState, useCallback } from 'react';
import { GeneratedAssets, JobDetails } from '../types';
import Button from '../components/Button';
import { usePdfGenerator } from '../hooks/usePdfGenerator';

interface ResultsScreenProps {
  assets: GeneratedAssets;
  jobDetails: JobDetails | null;
}

type ActiveTab = 'resume' | 'coverLetter' | 'changes' | 'originalText';

const ResultsScreen: React.FC<ResultsScreenProps> = ({ assets, jobDetails }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resume');
  const [copied, setCopied] = useState(false);
  const { downloadImagesAsPdf, downloadTextAsPdf } = usePdfGenerator();

  const handleCopyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(assets.originalResumeText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [assets.originalResumeText]);

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

  return (
    <div className="max-w-6xl mx-auto">
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
                <TabButton tabId="changes">Changes &amp; Keywords</TabButton>
                <TabButton tabId="originalText">Original Resume Text</TabButton>
            </div>
            
            <div className="min-h-[60vh]">
                {activeTab === 'resume' && (
                    <div>
                        <div className="flex justify-end mb-4">
                            <Button onClick={handleDownloadResume}>Download Resume (PDF)</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {assets.tailoredResumeImages.map((src, index) => (
                                <div key={index} className="aspect-[8.5/11] border border-gray-600 rounded-md overflow-hidden shadow-lg mx-auto max-w-full">
                                    <img src={src} alt={`Tailored Resume Page ${index + 1}`} className="object-contain w-full h-full bg-white" />
                                </div>
                            ))}
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
                    <div className="space-y-8 text-gray-200">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">Executive Summary</h3>
                            <p className="bg-gray-900 p-4 rounded-md border border-gray-600 whitespace-pre-wrap font-sans">
                                {assets.summary}
                            </p>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-white mb-3">Changes Made</h3>
                            <ul className="list-disc list-inside space-y-2 bg-gray-900 p-4 rounded-md border border-gray-600">
                                {assets.changes.map((change, index) => (
                                    <li key={index}>{change}</li>
                                ))}
                            </ul>
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
                            <Button onClick={handleCopyToClipboard}>{copied ? 'Copied!' : 'Copy Text'}</Button>
                        </div>
                        <div className="bg-gray-900 p-6 rounded-md border border-gray-600">
                            <p className="text-sm text-gray-400 mb-4">This is the text transcribed from your original resume, useful for pasting into online application forms.</p>
                            <pre className="whitespace-pre-wrap font-sans text-gray-200">{assets.originalResumeText}</pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default ResultsScreen;