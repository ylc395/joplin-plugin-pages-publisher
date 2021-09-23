import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';
import type { GitProgressEvent } from 'isomorphic-git';
import { isFunction, mapValues, omitBy, pickBy, isTypedArray, isObjectLike, noop } from 'lodash';
import fs from 'driver/fs/webviewApi';
import type { FsWorkerCallRequest, FsWorkerCallResponse } from 'driver/fs/type';
import { gitClientToken, GitEvents } from 'domain/service/PublishService';
import type { Github } from 'domain/model/Publishing';
import { joplinToken } from 'domain/service/AppService';
import type {
  GitWorkerRequest,
  WorkerCallResult,
  WorkerInitRepoRequest,
  WorkerPushRequest,
} from './type';

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
  private installDir?: string;
  private githubInfo?: Github;
  private getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  }
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private isPushing = false;
  private rejectInitPromise: null | ((reason: unknown) => void) = null;

  async init(githubInfo: Github, dir: string) {
    this.dir = dir;

    if (!this.installDir) {
      this.installDir = await this.joplin.installationDir();
    }

    if (!this.gitdir) {
      this.gitdir = await this.getGitRepositoryDir();
    }

    const oldGithubInfo = this.githubInfo;
    this.githubInfo = githubInfo;

    if (
      oldGithubInfo?.userName === githubInfo.userName &&
      oldGithubInfo?.token === githubInfo.token &&
      oldGithubInfo?.repositoryName === githubInfo.repositoryName
    ) {
      return;
    }

    // stop initializing! by terminating and reset worker
    if (this.initPromise) {
      this.terminate();
    }

    if (!this.worker) {
      this.initWorker();
    }

    return this.initRepo({
      needSetUserEmail: oldGithubInfo?.email !== githubInfo.email,
      needSetUserName: oldGithubInfo?.userName !== githubInfo.userName,
    });
  }

  private initRepo({
    needSetUserEmail,
    needSetUserName,
  }: {
    needSetUserEmail: boolean;
    needSetUserName: boolean;
  }) {
    const { worker, gitdir, githubInfo, dir } = this;

    if (!worker || !gitdir || !githubInfo || !dir) {
      throw new Error('cannot init repo');
    }

    const initPromise = new Promise<void>((resolve, reject) => {
      this.rejectInitPromise = reject;
      worker.addEventListener('message', function handler(e: MessageEvent<WorkerCallResult>) {
        if (e.data?.action === 'init') {
          e.data.result === 'success' ? resolve() : reject(e.data.error);
          this.removeEventListener('message', handler);
        }
      });
    });

    this.initPromise = initPromise;

    this.initPromise.then(() => {
      if (this.initPromise === initPromise) {
        this.initPromise = null;
        this.rejectInitPromise = null;
      }
    }, noop);

    const request: WorkerInitRepoRequest = {
      event: 'init',
      payload: {
        githubInfo,
        needSetUserEmail,
        needSetUserName,
        gitInfo: {
          dir,
          gitdir,
          url: Git.getRemoteUrl(githubInfo.userName, githubInfo.repositoryName),
          remote: Git.remote,
        },
      },
    };
    worker.postMessage(request);

    return this.initPromise;
  }

  private initWorker() {
    if (!this.installDir) {
      throw new Error('no install dir');
    }

    this.worker = new Worker(`${this.installDir}/driver/git/webWorker.js`);
    this.worker.addEventListener(
      'message',
      ({ data }: MessageEvent<FsWorkerCallRequest | GitWorkerRequest>) => {
        if (!data) {
          return;
        }

        const { event } = data;

        switch (event) {
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
            return;
        }
      },
    );
  }

  async push(files: string[], init: boolean) {
    if (this.isPushing) {
      throw new Error('pushing!');
    }

    if (!this.worker) {
      throw new Error('worker init failed');
    }

    if (!this.githubInfo || !this.dir || !this.gitdir) {
      throw new Error('git info is not prepared');
    }

    this.isPushing = true;

    try {
      if (init) {
        this.terminate();
        await this.initRepo({ needSetUserEmail: false, needSetUserName: false });
      } else {
        await this.initPromise;
      }
    } catch (error) {
      this.isPushing = false;
      throw error;
    }

    this.emit(GitEvents.START_PUSHING);

    const request: WorkerPushRequest = {
      event: 'push',
      payload: {
        files,
        githubInfo: this.githubInfo,
        gitInfo: {
          dir: this.dir,
          gitdir: this.gitdir,
          url: Git.getRemoteUrl(this.githubInfo.userName, this.githubInfo.repositoryName),
          remote: Git.remote,
        },
      },
    };

    const resultPromise = new Promise<void>((resolve, reject) => {
      this.worker?.addEventListener('message', function handler(e: MessageEvent<WorkerCallResult>) {
        if (e.data?.action === 'push') {
          e.data.result === 'success' ? resolve() : reject(e.data.error);
          this.removeEventListener('message', handler);
        }
      });
    });
    resultPromise.finally(() => (this.isPushing = false));
    this.worker.postMessage(request);

    return resultPromise;
  }

  terminate() {
    this.worker?.terminate();
    // todo: this crash app. why ???
    this.rejectInitPromise?.('terminated');
    this.emit(GitEvents.TERMINATED);
    this.initWorker();
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
  };
}

container.registerSingleton(gitClientToken, Git);
