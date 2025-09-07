
import React, { useState } from 'react';
import Button from '../components/Button';

interface HomeScreenProps {
  onStart: () => void;
}

const ResumeVisualDemo: React.FC = () => {
    const [showTailored, setShowTailored] = useState(false);

    const resumeBlock = (highlight: boolean = false) => (
        <div className="space-y-2">
            <div className={`h-2 rounded-sm ${highlight ? 'bg-indigo-400/80' : 'bg-gray-600'}`}></div>
            <div className={`h-2 rounded-sm w-5/6 ${highlight ? 'bg-indigo-400/80' : 'bg-gray-600'}`}></div>
        </div>
    );
    
     const resumeLine = (width = 'w-full') => (
        <div className={`h-1.5 rounded-sm bg-gray-700 ${width}`}></div>
    );

    return (
        <div className="relative w-full max-w-md mx-auto aspect-[8.5/11] bg-gray-800/50 rounded-lg border border-gray-700 shadow-2xl p-6 flex flex-col justify-between animate-fadeInUp animation-delay-400" style={{ opacity: 0 }}>
            {/* Header */}
            <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gray-700"></div>
                <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded-sm bg-gray-600"></div>
                    <div className="h-2 w-1/2 rounded-sm bg-gray-700"></div>
                </div>
            </div>

            {/* Body with Transition */}
            <div className="flex-grow my-6 relative overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-500 space-y-3 ${showTailored ? 'opacity-0' : 'opacity-100'}`}>
                    {resumeLine('w-11/12')}
                    {resumeLine('w-full')}
                    {resumeLine('w-10/12')}
                </div>
                 <div className={`absolute inset-0 transition-opacity duration-500 space-y-3 ${showTailored ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-1.5 rounded-sm bg-indigo-400/80 w-11/12"></div>
                    <div className="h-1.5 rounded-sm bg-indigo-400/80 w-full"></div>
                    <div className="h-1.5 rounded-sm bg-indigo-400/80 w-10/12"></div>
                </div>
            </div>
            
             <div className="flex-grow my-6 relative overflow-hidden">
                <div className={`absolute inset-0 transition-opacity duration-500 space-y-3 ${showTailored ? 'opacity-0' : 'opacity-100'}`}>
                    {resumeLine('w-full')}
                    {resumeLine('w-10/12')}
                    {resumeLine('w-11/12')}
                </div>
                 <div className={`absolute inset-0 transition-opacity duration-500 space-y-3 ${showTailored ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="h-1.5 rounded-sm bg-indigo-400/80 w-full"></div>
                    <div className="h-1.5 rounded-sm bg-gray-700 w-10/12"></div>
                    <div className="h-1.5 rounded-sm bg-indigo-400/80 w-11/12"></div>
                </div>
            </div>


            {/* Footer / Toggle */}
            <div className="flex justify-center items-center space-x-4">
                <span className={`text-sm font-medium ${!showTailored ? 'text-white' : 'text-gray-500'}`}>Original</span>
                 <button
                    type="button"
                    onClick={() => setShowTailored(!showTailored)}
                    className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 ${showTailored ? 'bg-indigo-600' : 'bg-gray-600'}`}
                    role="switch"
                    aria-checked={showTailored}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${showTailored ? 'translate-x-5' : 'translate-x-0'}`}
                    ></span>
                </button>
                <span className={`text-sm font-medium ${showTailored ? 'text-indigo-400' : 'text-gray-500'}`}>Tailored</span>
            </div>
        </div>
    );
};


const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-16 sm:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="text-center lg:text-left">
                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white animate-fadeInUp" style={{ opacity: 0 }}>
                        Your Resume,
                        <span className="block bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                            Reimagined for Every Job.
                        </span>
                    </h1>
                    <p className="mt-6 max-w-xl mx-auto lg:mx-0 text-lg text-gray-300 animate-fadeInUp animation-delay-200" style={{ opacity: 0 }}>
                        Our AI surgically adapts the content of your beautifully designed resume for any role, delivering a complete, job-winning application package while leaving your layout untouched.
                    </p>
                    <div className="mt-10 animate-fadeInUp animation-delay-600" style={{ opacity: 0 }}>
                        <Button onClick={onStart} variant="primary">
                            Create New Tailored Application
                        </Button>
                    </div>
                </div>
                 <div className="flex items-center justify-center">
                    <ResumeVisualDemo />
                </div>
            </div>
        </div>
    </div>
  );
};

export default HomeScreen;