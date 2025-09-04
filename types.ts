
export enum AppState {
  HOME = 'HOME',
  INPUT = 'INPUT',
  PROCESSING_TEXT = 'PROCESSING_TEXT',
  REFINEMENT = 'REFINEMENT',
  PROCESSING_IMAGES = 'PROCESSING_IMAGES',
  RESULTS = 'RESULTS',
}

export interface JobDetails {
  jobTitle: string;
  companyName: string;
  jobDescription: string;
}

export interface ChangeDetail {
  section: string;
  summary: string;
  originalText: string;
  newText: string;
  pageIndex: number;
}

// Result from the first, text-only generation step
export interface TextGenerationResult {
  coverLetter: string;
  summary: string;
  changes: ChangeDetail[];
  atsKeywords: string[];
}

// Result from the second, final asset generation step
export interface FinalAssetsResult {
  finalImages: string[];
  finalTexts: string[];
}

// Final assets after user has refined changes and images are generated
export interface GeneratedAssets {
  tailoredResumeImages: string[];
  coverLetter: string;
  originalResumeText: string;
  rewrittenResumeText: string;
  summary: string;
  changes: ChangeDetail[]; // This will now be the list of *applied* changes
  atsKeywords: string[];
}
