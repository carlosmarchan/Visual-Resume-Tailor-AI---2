
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const textMessages = [
  "Analyzing your resume and the job description...",
  "Identifying key skills and opportunities...",
  "Drafting a new summary and experience points...",
  "Detailing all proposed changes for your review...",
  "Almost ready for your review...",
];

const imageMessages = [
  "Applying your approved changes to the resume text...",
  "Recreating your resume page by page with the new content...",
  "Ensuring every font, color, and pixel is a perfect match...",
  "Finalizing your personalized application assets...",
  "Just a few more moments...",
];

interface ProcessingScreenProps {
    phase: 'text' | 'image';
}

const ProcessingScreen: React.FC<ProcessingScreenProps> = ({ phase }) => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
    const messages = phase === 'text' ? textMessages : imageMessages;

    useEffect(() => {
        // Reset message index when phase changes
        setCurrentMessageIndex(0);

        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => {
                if (prevIndex >= messages.length - 1) {
                    clearInterval(interval);
                    return prevIndex;
                }
                return prevIndex + 1;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, [phase, messages.length]);

    return (
        <div className="flex flex-col items-center justify-center text-center h-96">
            <LoadingSpinner />
            <h2 className="mt-8 text-2xl font-semibold text-white">AI is on the job...</h2>
            <p className="mt-2 text-gray-400 max-w-md transition-opacity duration-500">
                {messages[currentMessageIndex]}
            </p>
        </div>
    );
};

export default ProcessingScreen;
