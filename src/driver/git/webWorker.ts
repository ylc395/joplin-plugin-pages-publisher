/*  eslint-env worker*/
/// <reference lib="WebWorker" />
import http from 'isomorphic-git/http/web';
import fs from 'driver/fs/webWorker';
import { difference } from 'lodash';
import {
  setConfig,
  clone,
  listBranches,
  branch,
  add,
  listFiles,
  remove,
  commit,
  push,
  MessageCallback,
  ProgressCallback,
  AuthFailureCallback,
} from 'isomorphic-git';

import type {
  WorkerInitRepoRequest,
  WorkerPushRequest,
  GitWorkerAuthFailRequest,
  GitWorkerMessageRequest,
  GitWorkerProgressRequest,
  WorkerCallResult,
} from './type';

const onMessage: MessageCallback = (payload) =>
  self.postMessage({ event: 'message', payload } as GitWorkerMessageRequest);

const onProgress: ProgressCallback = (payload) =>
  self.postMessage({ event: 'progress', payload } as GitWorkerProgressRequest);

const onAuthFailure: AuthFailureCallback = (payload) => {
  self.postMessage({ event: 'authFail', payload } as GitWorkerAuthFailRequest);
  return { cancel: true };
};

const reportError = (action: WorkerCallResult['action']) => (e: Error) =>
  self.postMessage({ action, result: 'error', error: e } as WorkerCallResult);

self.addEventListener('message', (e: MessageEvent<WorkerInitRepoRequest | WorkerPushRequest>) => {
  switch (e.data?.event) {
    case 'init':
      initRepo(e.data.payload).catch(reportError('init'));
      break;
    case 'push':
      publish(e.data.payload).catch(reportError('push'));
      break;
    default:
      break;
  }
});

async function initRepo({
  gitInfo,
  githubInfo,
  needSetUserEmail,
  needSetUserName,
}: WorkerInitRepoRequest['payload']) {
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
    onAuthFailure,
    onMessage,
    onProgress,
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

  self.postMessage({ action: 'init', result: 'success' } as WorkerCallResult);
}

async function publish({
  gitInfo: { dir, gitdir, remote, url },
  githubInfo,
  files,
}: WorkerPushRequest['payload']) {
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
    ref: githubInfo.branch,
    remoteRef: githubInfo.branch,
    remote,
    url,
    onAuth: () => ({ username: githubInfo.userName, password: githubInfo.token }),
    onAuthFailure,
    onMessage,
    onProgress,
  });
  self.postMessage({ action: 'push', result: 'success' } as WorkerCallResult);
}
