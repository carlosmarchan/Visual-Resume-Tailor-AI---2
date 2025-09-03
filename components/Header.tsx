
import React from 'react';

interface HeaderProps {
    onReset: () => void;
    showReset: boolean;
}

const Header: React.FC<HeaderProps> = ({ onReset, showReset }) => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Visual Resume Tailor AI</h1>
                </div>
                {showReset && (
                     <button
                        onClick={onReset}
                        className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        Start Over
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
