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
  listBranches,
  branch,
} from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from 'driver/fs/webviewApi';
import { gitClientToken, GitEvents } from 'domain/service/PublishService';
import type { Github } from 'domain/model/Publishing';
import { difference } from 'lodash';

export interface GitRequest {
  event: 'getGitRepositoryDir';
}
declare const webviewApi: {
  postMessage: <T>(payload: GitRequest) => Promise<T>;
};

class Git extends EventEmitter<GitEvents> {
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
  private initPromise: Promise<void> = Promise.resolve();

  async init(githubInfo: Github, dir: string) {
    if (dir) {
      this.dir = dir;
    }

    if (!this.gitdir) {
      this.gitdir = await this.getGitRepositoryDir();
    }

    this.initPromise = this.initPromise.then(() => this.initRepo(githubInfo));
    return this.initPromise;
  }

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

    await fs.promises.emptyDir(gitdir);
    await fs.promises.emptyDir(dir);

    if (
      this.githubInfo?.userName !== userName ||
      this.githubInfo?.token !== token ||
      this.githubInfo?.repositoryName !== repositoryName
    ) {
      await clone({
        fs,
        http,
        dir,
        gitdir,
        url: Git.getRemoteUrl(userName, repositoryName),
        remote: Git.remote,
        depth: 1,
        noCheckout: true,
        onAuth: () => ({ username: userName, password: token }),
        onMessage: this.handleMessage,
        onProgress: this.handleProgress,
        onAuthFailure: this.handleAuthFail,
      });
    }

    const branches = await listBranches({ fs, dir, gitdir });

    if (!branches.includes(branchName)) {
      await branch({ fs, dir, gitdir, ref: branchName });
    }

    if (this.githubInfo?.userName !== userName) {
      await setConfig({ fs, gitdir, path: 'user.name', value: userName });
    }

    if (this.githubInfo?.email !== email) {
      await setConfig({ fs, gitdir, path: 'user.email', value: email });
    }

    this.githubInfo = { branch: branchName, email, userName, repositoryName, token };
  }

  async push(files: string[], force: boolean) {
    await this.initPromise;
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
