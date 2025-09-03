import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const messages = [
  "Analyzing your resume and the job description...",
  "Identifying key skills and opportunities...",
  "Drafting a new summary and experience points...",
  "Writing a compelling, tailored cover letter...",
  "Content draft complete! Now for the visual magic...",
  "Rebuilding your resume design with the new text...",
  "Ensuring every font, color, and pixel is perfect...",
  "Finalizing your personalized application assets...",
];

const ProcessingScreen: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => {
                // Stop cycling if it reaches the end.
                if (prevIndex === messages.length - 1) {
                    clearInterval(interval);
                    return prevIndex;
                }
                return prevIndex + 1;
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

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