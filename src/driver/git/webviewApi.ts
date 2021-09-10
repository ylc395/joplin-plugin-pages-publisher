import { container } from 'tsyringe';
import { init, push, add, commit } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from '../fs/webviewApi';
import { gitClientToken } from '../../domain/service/PublishService';
import { AppService } from '../../domain/service/AppService';
import type { Github } from '../../domain/model/Github';

class Git {
  private readonly appService = container.resolve(AppService);

  async push(files: string[], githubInfo: Github) {
    const dir = await this.appService.app.getOutputDir();
    const gitdir = await this.appService.app.getGitRepositoryDir();

    await init({ fs, gitdir, dir });

    for (const filepath of files) {
      await add({ fs, gitdir, dir, filepath: filepath.replace(`${dir}/`, '') });
    }

    await commit({
      fs,
      gitdir,
      message: 'test',
      author: { name: githubInfo.username, email: githubInfo.email },
    });

    // todo: handle non-simple-fast-forward push
    await push({
      fs,
      http,
      gitdir,
      remoteRef: githubInfo.branch,
      url: `https://github.com/${githubInfo.username}/${githubInfo.repositoryName}.git`,
      onAuth: () => ({ username: githubInfo.username, password: githubInfo.token }),
    });
  }
}

container.registerSingleton(gitClientToken, Git);
