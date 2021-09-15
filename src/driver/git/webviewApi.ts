import { container } from 'tsyringe';
import { init, push, add, commit } from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import fs from '../fs/webviewApi';
import { gitClientToken } from '../../domain/service/PublishService';
import type { Github } from '../../domain/model/Github';
import { getOutputDir, getGitRepositoryDir } from '../webview/utils/webviewApi';

class Git {
  async push(files: string[], githubInfo: Github) {
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
      remoteRef: githubInfo.branch,
      url: `https://github.com/${githubInfo.userName}/${githubInfo.repositoryName}.git`,
      onAuth: () => ({ username: githubInfo.userName, password: githubInfo.token }),
    });
  }
}

container.registerSingleton(gitClientToken, Git);
