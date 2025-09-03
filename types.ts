export enum AppState {
  HOME = 'HOME',
  INPUT = 'INPUT',
  PROCESSING = 'PROCESSING',
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
}

export interface GeneratedAssets {
  tailoredResumeImages: string[];
  coverLetter: string;
  originalResumeText: string;
  rewrittenResumeText: string;
  summary: string;
  changes: ChangeDetail[];
  atsKeywords: string[];
}
