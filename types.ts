
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

export interface GeneratedAssets {
  tailoredResumeImages: string[];
  coverLetter: string;
  originalResumeText: string;
  summary: string;
  changes: string[];
  atsKeywords: string[];
}