
import React, { useState, useEffect } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const messages = [
  "Analyzing your resume's unique design...",
  "Identifying key skills in the job description...",
  "Crafting compelling, tailored bullet points...",
  "Replicating your resume's layout with new content...",
  "Generating a professional cover letter...",
  "Finalizing your personalized application assets...",
];

const ProcessingScreen: React.FC = () => {
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentMessageIndex((prevIndex) => (prevIndex + 1) % messages.length);
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
