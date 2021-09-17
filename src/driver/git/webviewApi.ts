import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';
import {
  GitProgressEvent,
  push,
  add,
  commit,
  setConfig,
  listFiles,
  clone,
  remove,
} from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from '../fs/webviewApi';
import { gitClientToken, GitEvents } from '../../domain/service/PublishService';
import { Github } from '../../domain/model/Publishing';
import { difference } from 'lodash';

export interface GitRequest {
  event: 'getGitRepositoryDir';
}
declare const webviewApi: {
  postMessage: <T>(payload: GitRequest) => Promise<T>;
};

class Git extends EventEmitter<GitEvents> {
  private static readonly remote = 'github';
  private dir?: string;
  private gitdir?: string;
  private githubInfo?: Github;
  private get remoteUrl() {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }
    return `https://github.com/${this.githubInfo.userName}/${this.githubInfo.repositoryName}.git`;
  }
  private getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  }
  private initPromise: Promise<void> | null = null;

  async init(githubInfo: Github, dir: string) {
    if (this.initPromise) {
      return this.initPromise;
    }

    if (dir) {
      this.dir = dir;
    }

    if (!this.gitdir) {
      this.gitdir = await this.getGitRepositoryDir();
    }

    this.githubInfo = githubInfo;
    this.initPromise = this.initRepo();
    this.initPromise.then(() => (this.initPromise = null));

    return this.initPromise;
  }

  private async initRepo() {
    if (!this.githubInfo || !this.gitdir || !this.dir) {
      throw new Error('no github info');
    }

    await fs.promises.emptyDir(this.gitdir);
    await fs.promises.emptyDir(this.dir);

    await clone({
      fs,
      http,
      dir: this.dir,
      gitdir: this.gitdir,
      url: this.remoteUrl,
      ref: this.githubInfo.branch,
      remote: Git.remote,
      depth: 1,
      singleBranch: true,
      noCheckout: true,
      onAuth: this.handleAuth,
      onMessage: this.handleMessage,
      onProgress: this.handleProgress,
      onAuthFailure: this.handleAuthFail,
    });

    const { userName, email } = this.githubInfo;
    await setConfig({ fs, gitdir: this.gitdir, path: 'user.name', value: userName });
    await setConfig({ fs, gitdir: this.gitdir, path: 'user.email', value: email });
  }

  async push(files: string[], force: boolean) {
    await this.initPromise;
    const { dir, gitdir, remoteUrl: url, githubInfo } = this;

    if (!dir || !gitdir || !url || !githubInfo) {
      throw new Error('no github info');
    }

    await add({ fs, gitdir, dir, filepath: '.' });

    const filesExisted = await listFiles({ fs, gitdir, dir, ref: 'HEAD' });
    const files_ = files.map((path) => path.replace(`${dir}/`, ''));
    const deletedFiles = difference(filesExisted, files_);

    for (const deletedFile of deletedFiles) {
      await remove({ fs, dir, gitdir, filepath: deletedFile });
    }

    await commit({ fs, gitdir, message: 'test' });
    await push({
      fs,
      http,
      gitdir,
      dir,
      force,
      ref: githubInfo.branch,
      remoteRef: githubInfo.branch,
      remote: Git.remote,
      url,
      onAuth: this.handleAuth,
      onMessage: this.handleMessage,
      onProgress: this.handleProgress,
      onAuthFailure: this.handleAuthFail,
    });
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
