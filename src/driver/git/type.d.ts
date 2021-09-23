import type { Github } from 'domain/model/Publishing';
import type { GitProgressEvent } from 'isomorphic-git';

interface GitInfo {
  dir: string;
  gitdir: string;
  url: string;
  remote: string;
}

export interface WorkerInitRepoRequest {
  event: 'init';
  payload: {
    gitInfo: GitInfo;
    githubInfo: Github;
    needSetUserName: boolean;
    needSetUserEmail: boolean;
  };
}

export interface WorkerPushRequest {
  event: 'push';
  payload: {
    gitInfo: GitInfo;
    githubInfo: Github;
    files: string[];
  };
}

export interface GitWorkerMessageRequest {
  event: 'message';
  payload: string;
}

export interface GitWorkerProgressRequest {
  event: 'progress';
  payload: GitProgressEvent;
}

export interface GitWorkerAuthFailRequest {
  event: 'authFail';
}

export type GitWorkerRequest =
  | GitWorkerAuthFailRequest
  | GitWorkerMessageRequest
  | GitWorkerProgressRequest;

export interface WorkerCallResult {
  action: 'init' | 'push';
  result: 'success' | 'error';
  error?: Error;
}
