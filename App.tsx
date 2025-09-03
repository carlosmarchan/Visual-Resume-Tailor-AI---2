
import React, { useState, useCallback } from 'react';
import { AppState, JobDetails, GeneratedAssets } from './types';
import HomeScreen from './screens/HomeScreen';
import InputScreen from './screens/InputScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ResultsScreen from './screens/ResultsScreen';
import Header from './components/Header';
import { generateTailoredAssets, extractOriginalText } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [resumeImages, setResumeImages] = useState<string[]>([]);
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setAppState(AppState.INPUT);
    setJobDetails(null);
    setResumeImages([]);
    setGeneratedAssets(null);
    setError(null);
  };

  const handleGenerate = useCallback(async (
    currentJobDetails: JobDetails,
    currentResumeImages: string[]
  ) => {
    setJobDetails(currentJobDetails);
    setResumeImages(currentResumeImages);
    setAppState(AppState.PROCESSING);
    setError(null);

    try {
      const [tailoredResult, originalTextResult] = await Promise.all([
        generateTailoredAssets(currentResumeImages, currentJobDetails),
        extractOriginalText(currentResumeImages)
      ]);

      setGeneratedAssets({
        tailoredResumeImages: tailoredResult.tailoredResumeImages,
        coverLetter: tailoredResult.coverLetter,
        summary: tailoredResult.summary,
        changes: tailoredResult.changes,
        atsKeywords: tailoredResult.atsKeywords,
        originalResumeText: originalTextResult,
      });
      setAppState(AppState.RESULTS);
    } catch (err) {
      console.error(err);
      let errorMessage = 'An unknown error occurred during generation.';
      if (err instanceof Error) {
          if (err.message.includes('quota')) {
              errorMessage = 'You have exceeded your API quota. Please check your account.';
          } else if (err.message.includes('400')) {
              errorMessage = 'There was an issue with the request. The uploaded images might be invalid or the prompt too long.';
          } else if (err.message.includes('API key not valid')) {
              errorMessage = 'The provided API key is not valid. Please check your configuration.';
          } else {
              errorMessage = err.message;
          }
      }
      setError(errorMessage);
      setAppState(AppState.INPUT);
    }
  }, []);

  const renderContent = () => {
    switch (appState) {
      case AppState.HOME:
        return <HomeScreen onStart={handleStart} />;
      case AppState.INPUT:
        return <InputScreen onGenerate={handleGenerate} initialData={{jobDetails, resumeImages, error}} />;
      case AppState.PROCESSING:
        return <ProcessingScreen />;
      case AppState.RESULTS:
        return generatedAssets ? <ResultsScreen assets={generatedAssets} jobDetails={jobDetails} /> : <ProcessingScreen />;
      default:
        return <HomeScreen onStart={handleStart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans">
      <Header onReset={handleStart} showReset={appState !== AppState.HOME} />
      <main className="container mx-auto px-4 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;