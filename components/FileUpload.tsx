import React, { useState, useCallback } from 'react';
import { fileToBase64 } from '../services/geminiService';

interface FileUploadProps {
  onFilesChange: (base64Files: string[]) => void;
  initialImages: string[];
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, initialImages }) => {
  const [isDragging, setIsDragging] = useState(false);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validImageFiles = fileArray.filter((file: File) => ['image/jpeg', 'image/png'].includes(file.type));
    
    if (validImageFiles.length === 0) return;

    const base64Promises = validImageFiles.map(fileToBase64);
    const newBase64Results = await Promise.all(base64Promises);
    
    // Append new files to the existing list from props
    onFilesChange([...initialImages, ...newBase64Results]);
  }, [onFilesChange, initialImages]);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(event.target.files);
    // Reset file input to allow re-uploading the same file if needed
    event.target.value = '';
  }, [processFiles]);

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // This is necessary to allow dropping
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    processFiles(event.dataTransfer.files);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    onFilesChange(initialImages.filter((_, index) => index !== indexToRemove));
  };
  
  const handleClearAll = () => {
    onFilesChange([]);
  };

  const dropzoneClasses = `mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md bg-gray-800/50 transition-colors duration-200 ${
    isDragging ? 'border-indigo-400 bg-gray-800' : 'border-gray-600'
  }`;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-300">1. Upload Resume Pages (PNG or JPEG)</label>
      <div
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="space-y-1 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex text-sm text-gray-400">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-gray-800 rounded-md font-medium text-indigo-400 hover:text-indigo-300 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 focus-within:ring-indigo-500 px-1">
              <span>Upload files</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple accept="image/png, image/jpeg" onChange={handleFileChange} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
        </div>
      </div>
      {initialImages.length > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-300">Resume Previews:</h3>
            <button type="button" onClick={handleClearAll} className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">Clear All</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {initialImages.map((src, index) => (
              <div key={index} className="relative aspect-[8.5/11] border border-gray-600 rounded-md overflow-hidden shadow-lg group">
                <img src={src} alt={`Resume Page ${index + 1}`} className="object-contain w-full h-full bg-white" />
                <div className="absolute top-1 right-1 bg-gray-900/70 text-white text-xs rounded-full px-2 py-0.5 pointer-events-none group-hover:opacity-0 transition-opacity">{index + 1}</div>
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <button type="button" onClick={() => handleRemoveImage(index)} className="text-white bg-red-600 hover:bg-red-500 rounded-full p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-red-500" aria-label={`Remove page ${index + 1}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;