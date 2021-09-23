/*  eslint-env worker*/
/// <reference lib="WebWorker" />
import http from 'isomorphic-git/http/web';
import fs from 'driver/fs/webWorker';
import { setConfig, clone, listBranches, branch } from 'isomorphic-git';
import type {
  WorkerInitRequest,
  GitWorkerAuthFailRequest,
  GitWorkerFinishedRequest,
  GitWorkerMessageRequest,
  GitWorkerProgressRequest,
} from './type';

self.addEventListener('message', async (e: MessageEvent<WorkerInitRequest>) => {
  if (e.data?.event === 'init') {
    try {
      await initRepo(e.data.payload);
      self.postMessage({ event: 'finished' });
    } catch (error) {
      setTimeout(() => {
        throw error;
      });
    }
  }
});

async function initRepo({
  gitInfo,
  githubInfo,
  needSetUserEmail,
  needSetUserName,
}: WorkerInitRequest['payload']) {
  const { userName, token, branch: branchName = 'master', email } = githubInfo;
  const { dir, gitdir, url, remote } = gitInfo;

  await fs.promises.emptyDir(gitdir);
  await fs.promises.emptyDir(dir);

  await clone({
    fs,
    http,
    dir,
    gitdir,
    url,
    remote,
    depth: 1,
    noCheckout: true,
    onAuth: () => ({ username: userName, password: token }),
    onMessage: (payload) =>
      self.postMessage({ event: 'message', payload } as GitWorkerMessageRequest),
    onProgress: (payload) =>
      self.postMessage({ event: 'progress', payload } as GitWorkerProgressRequest),
    onAuthFailure: (payload) =>
      self.postMessage({ event: 'authFail', payload } as GitWorkerAuthFailRequest),
  });

  const branches = await listBranches({ fs, dir, gitdir });

  if (!branches.includes(branchName)) {
    await branch({ fs, dir, gitdir, ref: branchName });
  }

  if (needSetUserName) {
    await setConfig({ fs, gitdir, path: 'user.name', value: userName });
  }

  if (needSetUserEmail) {
    await setConfig({ fs, gitdir, path: 'user.email', value: email });
  }

  self.postMessage({ event: 'finished' } as GitWorkerFinishedRequest);
}
