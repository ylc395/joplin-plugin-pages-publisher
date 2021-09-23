import type { Github } from 'domain/model/Publishing';
import type { GitProgressEvent } from 'isomorphic-git';

interface WorkerInitRepoParams {
  gitInfo: {
    dir: string;
    gitdir: string;
    url: string;
    remote: string;
  };
  githubInfo: Github;
  needSetUserName: boolean;
  needSetUserEmail: boolean;
}

export interface WorkerInitRequest {
  event: 'init';
  payload: WorkerInitRepoParams;
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

export interface GitWorkerFinishedRequest {
  event: 'finished';
}
export type GitWorkerRequest =
  | GitWorkerAuthFailRequest
  | GitWorkerFinishedRequest
  | GitWorkerMessageRequest
  | GitWorkerProgressRequest;
