export interface Github {
  userName: string;
  email: string;
  repositoryName?: string;
  branch?: string;
  token?: string;
  cname?: string;
}

export const DEFAULT_GITHUB: Github = {
  userName: '',
  email: '',
  repositoryName: undefined,
  branch: undefined,
  cname: undefined,
} as const;

export interface GeneratingProgress {
  totalPages: number;
  generatedPages: number;
  result?: null | 'success' | 'fail';
  message?: string;
}

export enum PublishResults {
  SUCCESS = 'SUCCESS',
  GITHUB_INFO_ERROR = 'GITHUB_INFO_ERROR',
  TERMINATED = 'TERMINATED',
  FAIL = 'FAIL',
}

export interface PublishingProgress {
  phase: string;
  message: string;
  loaded: number;
  total: number;
  result: null | PublishResults;
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
  result: null,
} as const;

export const DEFAULT_GITHUB_BRANCH = 'main';
