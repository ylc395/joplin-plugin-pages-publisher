import { container } from 'tsyringe';
import { init, push, add, commit } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from '../fs/webviewApi';
import { gitClientToken } from '../../domain/service/PublishService';
import { token as appToken } from '../../domain/service/AppService';
import type { Github } from '../../domain/model/Github';

class Git {
  private readonly app = container.resolve(appToken);

  async push(files: string[], githubInfo: Github) {
    const dir = await this.app.getOutputDir();
    const gitdir = await this.app.getGitRepositoryDir();

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
  }
}

container.registerSingleton(gitClientToken, Git);
