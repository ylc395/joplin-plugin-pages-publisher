export interface Github {
  username: string;
  repositoryName: string;
  branch?: string;
  email: string;
  token: string;
}

export interface Git {
  push: (files: string[], info: Github) => Promise<void>;
}
