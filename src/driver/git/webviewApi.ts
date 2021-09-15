import { container } from 'tsyringe';
import { init, push, add, commit, GitProgressEvent } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from '../fs/webviewApi';
import { gitClientToken, initialPublishProgress } from '../../domain/service/PublishService';
import type { Github, PublishingProgress } from '../../domain/model/Publishing';
import { getOutputDir, getGitRepositoryDir } from '../webview/utils/webviewApi';

class Git {
  private progress: PublishingProgress = { ...initialPublishProgress };
  async push(files: string[], githubInfo: Github, force: boolean) {
    const dir = await getOutputDir();
    const gitdir = await getGitRepositoryDir();

    await init({ fs, gitdir, dir });

    for (const filepath of files) {
      await add({ fs, gitdir, dir, filepath: filepath.replace(`${dir}/`, '') });
    }

    await commit({
      fs,
      gitdir,
      message: 'test',
      author: { name: githubInfo.userName, email: githubInfo.email },
    });

    // todo: handle non-simple-fast-forward push
    await push({
      fs,
      http,
      gitdir,
      force,
      remoteRef: githubInfo.branch,
      url: `https://github.com/${githubInfo.userName}/${githubInfo.repositoryName}.git`,
      onAuth: () => ({ username: githubInfo.userName, password: githubInfo.token }),
      onProgress: this.handleProgress.bind(this),
      onMessage: this.handleMessage.bind(this),
    });
  }

  private handleProgress(e: GitProgressEvent) {
    Object.assign(this.progress, e);
  }

  private handleMessage(e: string) {
    this.progress.message = e;
  }

  getProgress() {
    return Promise.resolve(this.progress);
  }
}

container.registerSingleton(gitClientToken, Git);
