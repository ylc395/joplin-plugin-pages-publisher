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
