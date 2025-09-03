
import React, { useState, useCallback } from 'react';
import { JobDetails } from '../types';
import FileUpload from '../components/FileUpload';
import Button from '../components/Button';

interface InputScreenProps {
  onGenerate: (jobDetails: JobDetails, resumeImages: string[]) => void;
  initialData: {
    jobDetails: JobDetails | null;
    resumeImages: string[];
    error: string | null;
  }
}

const InputScreen: React.FC<InputScreenProps> = ({ onGenerate, initialData }) => {
  const [resumeImages, setResumeImages] = useState<string[]>(initialData.resumeImages || []);
  const [jobTitle, setJobTitle] = useState(initialData.jobDetails?.jobTitle || '');
  const [companyName, setCompanyName] = useState(initialData.jobDetails?.companyName || '');
  const [jobDescription, setJobDescription] = useState(initialData.jobDetails?.jobDescription || '');

  const isFormValid = resumeImages.length > 0 && jobTitle && companyName && jobDescription;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isFormValid) {
      onGenerate({ jobTitle, companyName, jobDescription }, resumeImages);
    }
  };

  const handleFilesChange = useCallback((files: string[]) => {
    setResumeImages(files);
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {initialData.error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{initialData.error}</span>
        </div>
      )}
      <div className="bg-gray-800/50 p-8 rounded-lg shadow-2xl border border-gray-700">
        <form onSubmit={handleSubmit} className="space-y-8">
          <FileUpload onFilesChange={handleFilesChange} initialImages={resumeImages} />

          <div className="space-y-4">
            <h2 className="text-sm font-medium text-gray-300">2. Enter Job Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="job-title" className="block text-sm font-medium text-gray-400 mb-1">Job Title</label>
                <input type="text" id="job-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-400 mb-1">Company Name</label>
                <input type="text" id="company-name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>
            <div>
              <label htmlFor="job-description" className="block text-sm font-medium text-gray-400 mb-1">Job Description</label>
              <textarea id="job-description" rows={10} value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded-md px-3 py-2 text-white focus:ring-indigo-500 focus:border-indigo-500" placeholder="Paste the full job description here..."></textarea>
            </div>
          </div>
          
          <div className="text-center pt-4">
            <Button type="submit" disabled={!isFormValid} variant="primary">
              Generate Tailored Documents
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputScreen;
