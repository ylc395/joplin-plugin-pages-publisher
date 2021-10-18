import type { Github } from 'domain/model/Publishing';
import type { MessageCallback, ProgressCallback } from 'isomorphic-git';

interface GitInfo {
  dir: string;
  gitdir: string;
  url: string;
  remote: string;
}

export interface GitEventHandler {
  onMessage: MessageCallback;
  onProgress: ProgressCallback;
}

export interface WorkerGit {
  initRepo: (payload: { gitInfo: GitInfo; githubInfo: Github; keepDir: boolean }) => Promise<void>;

  publish: (payload: { gitInfo: GitInfo; githubInfo: Github; files: string[] }) => Promise<void>;
}
