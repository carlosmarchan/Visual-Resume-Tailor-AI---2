
import React from 'react';
import Button from '../components/Button';

interface HomeScreenProps {
  onStart: () => void;
}

const Sparkle: React.FC<{className: string}> = ({className}) => (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" className={`absolute ${className} text-yellow-300 opacity-0 animate-sparkle`}>
        <path d="M10 0L11.7557 6.2443L18.0902 8.2443L13.0902 11.7557L14.8459 18.0902L10 14.8459L5.1541 18.0902L6.90983 11.7557L1.90983 8.2443L8.2443 6.2443L10 0Z" />
    </svg>
);

const HomeScreen: React.FC<HomeScreenProps> = ({ onStart }) => {
  return (
    <div className="text-center py-16 sm:py-24">
       <div className="relative inline-block">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
                Turn Your <span className="text-indigo-400">Design</span> into an <span className="text-indigo-400">Opportunity</span>.
            </h2>
            <Sparkle className="top-0 left-0" />
            <Sparkle className="top-1/4 right-0 animate-delay-200" />
            <Sparkle className="bottom-0 left-1/4 animate-delay-400" />
            <Sparkle className="bottom-1/4 right-1/4 animate-delay-600" />
        </div>
      <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
        Stop copy-pasting. Our AI tailors your resume's text for any job while keeping your beautiful design pixel-perfect.
      </p>
      <div className="mt-10">
        <Button onClick={onStart} variant="primary">
          Create New Tailored Application
        </Button>
      </div>
    </div>
  );
};

export default HomeScreen;
