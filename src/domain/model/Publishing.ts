export interface Github {
  userName: string;
  repositoryName: string;
  email: string;
  branch?: string;
  token?: string;
}

export interface GeneratingProgress {
  totalPages: number;
  generatedPages: number;
  result?: null | 'success' | 'fail';
  message?: string;
}

export interface PublishingProgress {
  phase: string;
  message: string;
  loaded: number;
  total: number;
  result?: null | 'success' | 'fail';
}

export const initialGeneratingProgress: Required<GeneratingProgress> = {
  totalPages: 0,
  generatedPages: 0,
  result: null,
  message: '',
} as const;

export const initialPublishProgress: PublishingProgress = {
  phase: '',
  message: '',
  loaded: 0,
  total: 0,
} as const;
