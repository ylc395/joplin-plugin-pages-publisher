import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';
import type { GitProgressEvent } from 'isomorphic-git';
import {
  isFunction,
  mapValues,
  omitBy,
  pickBy,
  isTypedArray,
  isObjectLike,
  isError,
  cloneDeep,
} from 'lodash';
import { wrap, Remote, releaseProxy, expose } from 'comlink';
import fs from 'driver/fs/webviewApi';
import type { FsWorkerCallRequest, FsWorkerCallResponse } from 'driver/fs/type';
import { gitClientToken, GitEvents } from 'domain/service/PublishService';
import { Github, PublishResults } from 'domain/model/Publishing';
import { joplinToken } from 'domain/service/AppService';
import type { GitEventHandler, WorkerGit } from './type';

export interface GitRequest {
  event: 'getGitRepositoryDir';
}
declare const webviewApi: {
  postMessage: <T>(payload: GitRequest) => Promise<T>;
};

class Git extends EventEmitter<GitEvents> {
  private readonly joplin = container.resolve(joplinToken);
  private static readonly remote = 'github';
  private static getRemoteUrl(userName: string, repoName?: string) {
    const repoName_ = repoName || `${userName}.github.io`;
    return `https://github.com/${userName}/${repoName_}.git`;
  }
  private static getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  }
  private dir?: string;
  private gitdir?: string;
  private installDir?: string;
  private githubInfo?: Github;
  private worker?: Worker;
  private workerGit?: Remote<WorkerGit>;
  private initRepoPromise?: Promise<void>;
  private stopInitRepo?: (reason: unknown) => void;
  private isPushing = false;

  async init(githubInfo: Github, dir: string) {
    this.dir = dir;

    if (!this.installDir) {
      this.installDir = await this.joplin.installationDir();
    }

    if (!this.gitdir) {
      this.gitdir = await Git.getGitRepositoryDir();
    }

    const oldGithubInfo = this.githubInfo;
    this.githubInfo = cloneDeep(githubInfo);

    if (
      oldGithubInfo?.userName === githubInfo.userName &&
      oldGithubInfo?.token === githubInfo.token &&
      (oldGithubInfo?.repositoryName || undefined) === (githubInfo.repositoryName || undefined)
    ) {
      return;
    }

    return this.initRepo();
  }

  private initRepo() {
    // always init worker when init repo
    this.initWorker();

    const { gitdir, githubInfo, dir, workerGit } = this;

    if (!workerGit || !gitdir || !githubInfo || !dir) {
      throw new Error('cannot init repo');
    }

    this.initRepoPromise = new Promise((resolve, reject) => {
      const reject_ = (e: unknown) => {
        reject(e);
        this.emit(GitEvents.INIT_REPO_STATUS_CHANGED, 'fail');
      };

      const resolve_ = () => {
        resolve();
        this.emit(GitEvents.INIT_REPO_STATUS_CHANGED, 'ready');
      };

      this.stopInitRepo = reject_;
      this.emit(GitEvents.INIT_REPO_STATUS_CHANGED, 'initializing');
      workerGit
        .initRepo({
          githubInfo,
          gitInfo: {
            dir,
            gitdir,
            url: Git.getRemoteUrl(githubInfo.userName, githubInfo.repositoryName),
            remote: Git.remote,
          },
        })
        .then(resolve_, reject_);
    });

    return this.initRepoPromise;
  }

  private initWorker(triggerTerminate = false) {
    if (!this.installDir) {
      throw new Error('no install dir');
    }

    this.worker?.terminate();

    if (triggerTerminate) {
      this.emit(GitEvents.TERMINATED);
    }

    this.workerGit?.[releaseProxy]();
    this.stopInitRepo?.('Repo Initialization has been terminated');
    this.stopInitRepo = void 0;

    this.worker = new Worker(`${this.installDir}/driver/git/webWorker.js`);
    this.workerGit = wrap(this.worker);

    const eventHandler: GitEventHandler = {
      onMessage: this.handleMessage,
      onProgress: this.handleProgress,
    };
    expose(eventHandler, this.worker);

    this.worker.addEventListener('message', ({ data }: MessageEvent<FsWorkerCallRequest>) => {
      switch (data?.event) {
        case 'fsCall':
          this.handleFsCall(data.payload);
          break;
        default:
          return;
      }
    });
  }

  async push(files: string[], init: boolean) {
    if (this.isPushing) {
      throw new Error('pushing!');
    }

    if (!this.workerGit) {
      throw new Error('worker init failed');
    }

    if (!this.githubInfo || !this.dir || !this.gitdir) {
      throw new Error('git info is not prepared');
    }

    this.isPushing = true;
    const terminatePromise = new Promise<never>((resolve, reject) => {
      this.once(GitEvents.TERMINATED, () => reject(Error(PublishResults.TERMINATED)));
    });

    try {
      if (init) {
        await Promise.race([this.initRepo(), terminatePromise]);
      } else {
        await Promise.race([this.initRepoPromise, terminatePromise]);
      }
    } catch (error) {
      this.isPushing = false;

      if (isError(error) && (error.message.includes('401') || error.message.includes('404'))) {
        throw Error(PublishResults.GITHUB_INFO_ERROR);
      } else {
        throw error;
      }
    }

    try {
      await Promise.race([
        this.workerGit.publish({
          files,
          githubInfo: this.githubInfo,
          gitInfo: {
            dir: this.dir,
            gitdir: this.gitdir,
            url: Git.getRemoteUrl(this.githubInfo.userName, this.githubInfo.repositoryName),
            remote: Git.remote,
          },
        }),
        terminatePromise,
      ]);
    } finally {
      this.isPushing = false;
    }
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

  terminate() {
    this.initWorker(true);
  }
}

container.registerSingleton(gitClientToken, Git);
