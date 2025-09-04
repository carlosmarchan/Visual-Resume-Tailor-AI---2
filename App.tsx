
import React, { useState, useCallback } from 'react';
import { AppState, JobDetails, GeneratedAssets, TextGenerationResult, ChangeDetail } from './types';
import HomeScreen from './screens/HomeScreen';
import InputScreen from './screens/InputScreen';
import ProcessingScreen from './screens/ProcessingScreen';
import ResultsScreen from './screens/ResultsScreen';
import RefinementScreen from './screens/RefinementScreen';
import Header from './components/Header';
import { generateTextAssets, generateFinalAssets, extractOriginalText } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.HOME);
  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  const [resumeImages, setResumeImages] = useState<string[]>([]);
  const [textAssets, setTextAssets] = useState<TextGenerationResult | null>(null);
  const [originalResumeText, setOriginalResumeText] = useState<string>('');
  const [generatedAssets, setGeneratedAssets] = useState<GeneratedAssets | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setAppState(AppState.INPUT);
    setJobDetails(null);
    setResumeImages([]);
    setTextAssets(null);
    setGeneratedAssets(null);
    setOriginalResumeText('');
    setError(null);
  };

  const handleInitialGenerate = useCallback(async (
    currentJobDetails: JobDetails,
    currentResumeImages: string[]
  ) => {
    setJobDetails(currentJobDetails);
    setResumeImages(currentResumeImages);
    setAppState(AppState.PROCESSING_TEXT);
    setError(null);

    try {
      // First, generate only the text assets and extract original text
      const [textResult, originalTextResult] = await Promise.all([
          generateTextAssets(currentResumeImages, currentJobDetails),
          extractOriginalText(currentResumeImages)
      ]);
      
      setTextAssets(textResult);
      setOriginalResumeText(originalTextResult);
      setAppState(AppState.REFINEMENT);
    } catch (err) {
      handleError(err);
      setAppState(AppState.INPUT);
    }
  }, []);

  const handleRefinement = useCallback(async (appliedChanges: ChangeDetail[]) => {
    if (!resumeImages.length || !textAssets || !originalResumeText) {
        setError("Missing data to proceed with generation. Please start over.");
        setAppState(AppState.INPUT);
        return;
    }
    
    setAppState(AppState.PROCESSING_IMAGES);
    setError(null);
    
    try {
        const { finalImages, finalTexts } = await generateFinalAssets(resumeImages, originalResumeText, textAssets.changes, appliedChanges);

        // Combine all assets for the final results screen
        setGeneratedAssets({
            tailoredResumeImages: finalImages,
            coverLetter: textAssets.coverLetter,
            summary: textAssets.summary,
            changes: appliedChanges, // only show the changes that were actually applied
            atsKeywords: textAssets.atsKeywords,
            originalResumeText: originalResumeText,
            rewrittenResumeText: finalTexts.join('\n\n---\nPage Break\n---\n\n'),
        });
        setAppState(AppState.RESULTS);
    } catch (err) {
        handleError(err);
        setAppState(AppState.REFINEMENT); // Go back to refinement screen on image generation failure
    }
  }, [resumeImages, textAssets, originalResumeText]);
  
  const handleError = (err: unknown) => {
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
  }

  const renderContent = () => {
    switch (appState) {
      case AppState.HOME:
        return <HomeScreen onStart={handleStart} />;
      case AppState.INPUT:
        return <InputScreen onGenerate={handleInitialGenerate} initialData={{jobDetails, resumeImages, error}} />;
      case AppState.PROCESSING_TEXT:
        return <ProcessingScreen phase="text" />;
      case AppState.REFINEMENT:
        return textAssets ? <RefinementScreen textAssets={textAssets} onConfirm={handleRefinement} /> : <ProcessingScreen phase="text" />;
      case AppState.PROCESSING_IMAGES:
        return <ProcessingScreen phase="image" />;
      case AppState.RESULTS:
        return generatedAssets ? <ResultsScreen assets={generatedAssets} jobDetails={jobDetails} originalResumeImages={resumeImages} /> : <ProcessingScreen phase="image" />;
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
