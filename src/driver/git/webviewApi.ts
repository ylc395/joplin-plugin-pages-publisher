import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';
import { GitProgressEvent, push, add, commit, listFiles, remove } from 'isomorphic-git';
import {
  difference,
  isFunction,
  mapValues,
  omitBy,
  pickBy,
  isTypedArray,
  isObjectLike,
  noop,
} from 'lodash';
import http from 'isomorphic-git/http/web';
import fs from 'driver/fs/webviewApi';
import type { FsWorkerCallRequest, FsWorkerCallResponse } from 'driver/fs/type';
import { gitClientToken, GitEvents } from 'domain/service/PublishService';
import type { Github } from 'domain/model/Publishing';
import { joplinToken } from 'domain/service/AppService';
import type { WorkerInitRequest, GitWorkerRequest } from './type';

export interface GitRequest {
  event: 'getGitRepositoryDir';
}
declare const webviewApi: {
  postMessage: <T>(payload: GitRequest) => Promise<T>;
};

class Git extends EventEmitter<GitEvents> {
  private readonly joplin = container.resolve(joplinToken);
  private static readonly remote = 'github';
  private static getRemoteUrl(userName: string, repoName: string) {
    return `https://github.com/${userName}/${repoName}.git`;
  }
  private dir?: string;
  private gitdir?: string;
  private githubInfo?: Github;
  private getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  }
  private worker: Worker | null = null;
  private isPushing = false;
  private initRepoPromise?: Promise<void>;

  async init(githubInfo: Github, dir: string) {
    if (dir) {
      this.dir = dir;
    }

    if (!this.gitdir) {
      this.gitdir = await this.getGitRepositoryDir();
    }

    return this.initRepo(githubInfo);
  }

  //todo: how to stop init process?
  private async initRepo({
    branch: branchName = 'master',
    userName,
    repositoryName,
    email,
    token,
  }: Github) {
    if (!this.gitdir || !this.dir) {
      throw new Error('no dir info');
    }

    const { dir, gitdir } = this;
    const installDir = await this.joplin.installationDir();

    if (
      this.githubInfo?.userName === userName &&
      this.githubInfo?.token === token &&
      this.githubInfo?.repositoryName === repositoryName
    ) {
      return;
    }

    if (this.worker) {
      this.worker.terminate();
    }

    this.initRepoPromise = new Promise<void>((resolve, reject) => {
      this.worker = new Worker(`${installDir}/driver/git/webWorker.js`);
      const githubInfo = { branch: branchName, email, userName, repositoryName, token };
      this.worker.addEventListener(
        'message',
        async ({ data }: MessageEvent<FsWorkerCallRequest | GitWorkerRequest>) => {
          if (!data) {
            return;
          }

          const { event } = data;

          switch (event) {
            case 'finished':
              this.worker?.terminate();
              this.worker = null;
              this.githubInfo = githubInfo;
              resolve();
              break;
            case 'message':
              this.handleMessage(data.payload);
              break;
            case 'progress':
              this.handleProgress(data.payload);
              break;
            case 'authFail':
              this.handleAuthFail();
              break;
            case 'fsCall':
              this.handleFsCall(data.payload);
              break;
            default:
              break;
          }
        },
      );

      this.worker.addEventListener('error', (e) => {
        this.worker?.terminate();
        this.worker = null;
        reject(e);
        e.preventDefault();
      });

      const request: WorkerInitRequest = {
        event: 'init',
        payload: {
          needSetUserName: this.githubInfo?.userName !== userName,
          needSetUserEmail: this.githubInfo?.email !== email,
          githubInfo,
          gitInfo: {
            dir,
            gitdir,
            url: Git.getRemoteUrl(userName, repositoryName),
            remote: Git.remote,
          },
        },
      };

      this.worker.postMessage(request);
    });

    return this.initRepoPromise;
  }

  async push(files: string[], force: boolean) {
    if (this.isPushing) {
      throw new Error('git is pushing');
    }
    this.isPushing = true;
    await this.initRepoPromise;

    const { dir, gitdir, githubInfo } = this;

    if (!dir || !gitdir || !githubInfo) {
      throw new Error('no github info');
    }

    await add({ fs, gitdir, dir, filepath: '.' });

    const filesExisted = await listFiles({ fs, gitdir, dir, ref: githubInfo.branch });
    const files_ = files.map((path) => path.replace(`${dir}/`, ''));
    const deletedFiles = difference(filesExisted, files_);

    for (const deletedFile of deletedFiles) {
      await remove({ fs, dir, gitdir, filepath: deletedFile });
    }

    await commit({ fs, gitdir, message: 'test', ref: githubInfo.branch });
    await push({
      fs,
      http,
      gitdir,
      dir,
      force,
      ref: githubInfo.branch,
      remoteRef: githubInfo.branch,
      remote: Git.remote,
      url: Git.getRemoteUrl(githubInfo.userName, githubInfo.repositoryName),
      onAuth: this.handleAuth,
      onMessage: this.handleMessage,
      onProgress: this.handleProgress,
      onAuthFailure: this.handleAuthFail,
    });
    this.isPushing = false;
  }

  private async handleFsCall({ args, callId, funcName }: FsWorkerCallRequest['payload']) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (fs.promises[funcName] as any)(...args);
      const needTransform = isObjectLike(result) && !isTypedArray(result) && !Array.isArray(result);
      const response: FsWorkerCallResponse = {
        event: 'fsCallResponse',
        payload: {
          isError: false,
          result: needTransform ? omitBy(result, isFunction) : result,
          methodsResult: needTransform
            ? mapValues(pickBy(result, isFunction), (value) => value())
            : {},
          callId,
        },
      };
      this.worker?.postMessage(response);
    } catch (error) {
      const response: FsWorkerCallResponse = {
        event: 'fsCallResponse',
        payload: { isError: true, result: error, methodsResult: {}, callId },
      };
      this.worker?.postMessage(response);
    }
  }

  private handleProgress = (e: GitProgressEvent) => {
    this.emit(GitEvents.PROGRESS, e);
  };

  private handleMessage = (e: string) => {
    this.emit(GitEvents.MESSAGE, e);
  };

  private handleAuthFail = () => {
    this.emit(GitEvents.AUTH_FAIL);
    return { cancel: true };
  };

  private handleAuth = () => {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }

    return {
      username: this.githubInfo.userName,
      password: this.githubInfo.token,
    };
  };
}

container.registerSingleton(gitClientToken, Git);
