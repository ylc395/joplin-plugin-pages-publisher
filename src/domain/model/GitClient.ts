import type EventEmitter from 'eventemitter3';
import type { InjectionToken } from 'tsyringe';

export interface Github {
  userName: string;
  email: string;
  repositoryName?: string;
  branch?: string;
  token?: string;
  cname?: string;
}

export enum GitEvents {
  Progress = 'progress',
  Message = 'message',
  Terminated = 'terminated',
  LocalRepoStatusChanged = 'localRepoStatusChanged',
}

export enum GithubClientEvents {
  InfoChanged = 'infoChanged',
}

export interface GithubClient extends EventEmitter<GithubClientEvents> {
  init(github: Github): void;
  createRepository(): Promise<void>;
  getRepositoryUrl(): string;
  getRepositoryName(): string;
  getDefaultRepositoryName(): string;
  getGithubInfo(): Readonly<Github>;
}

export const githubClientToken: InjectionToken<GithubClient> = Symbol();

export interface Git extends EventEmitter<GitEvents> {
  init: (github: GithubClient, dir: string) => Promise<void>;
  push: (files: string[], init: boolean) => Promise<void>;
  terminate: () => void;
}

export const gitClientToken: InjectionToken<Git> = Symbol();
