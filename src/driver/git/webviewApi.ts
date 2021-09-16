import { container } from 'tsyringe';
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
import { gitClientToken, generatorToken } from '../../domain/service/PublishService';
import { Github, PublishingProgress, initialPublishProgress } from '../../domain/model/Publishing';
import { difference } from 'lodash';

export interface GitRequest {
  event: 'getGitRepositoryDir';
}
declare const webviewApi: {
  postMessage: <T>(payload: GitRequest) => Promise<T>;
};

class Git {
  private static readonly remote = 'github';
  private readonly generator = container.resolve(generatorToken);
  private dir?: string;
  private gitdir?: string;
  private githubInfo?: Github;
  private get remoteUrl() {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }
    return `https://github.com/${this.githubInfo.userName}/${this.githubInfo.repositoryName}.git`;
  }
  private progress: PublishingProgress = { ...initialPublishProgress };
  private getGitRepositoryDir() {
    return webviewApi.postMessage<string>({ event: 'getGitRepositoryDir' });
  }

  async init(githubInfo: Github) {
    this.githubInfo = githubInfo;

    if (!this.dir) {
      this.dir = await this.generator.getOutputDir();
    }

    if (!this.gitdir) {
      this.gitdir = await this.getGitRepositoryDir();
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
    });
    await setConfig({ fs, gitdir: this.gitdir, path: 'user.name', value: githubInfo.userName });
    await setConfig({ fs, gitdir: this.gitdir, path: 'user.email', value: githubInfo.email });
  }

  async push(files: string[], force: boolean) {
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

    await commit({
      fs,
      gitdir,
      message: 'test',
    });

    if (!dir || !gitdir || !url || !githubInfo) {
      throw new Error('no github info');
    }

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
    });
  }

  private handleProgress = (e: GitProgressEvent) => {
    Object.assign(this.progress, e);
  };

  private handleMessage = (e: string) => {
    this.progress.message = e;
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

  getProgress() {
    return Promise.resolve(this.progress);
  }
}

container.registerSingleton(gitClientToken, Git);
