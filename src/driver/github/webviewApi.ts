import { container } from 'tsyringe';
import { EventEmitter } from 'eventemitter3';
import { cloneDeep } from 'lodash';
import { GithubClient, GithubClientEvents, githubClientToken } from 'domain/service/PublishService';
import { Github as GithubInfo, PublishError, PublishResults } from 'domain/model/Publishing';

export class Github extends EventEmitter<GithubClientEvents> implements GithubClient {
  private githubInfo?: GithubInfo;

  private async request(method: 'GET' | 'POST', path: string, payload?: Record<string, string>) {
    if (!this.githubInfo?.token) {
      throw new Error('no github info');
    }

    const response = await fetch(
      `https://api.github.com${path}${
        method === 'GET' && payload ? `?${new URLSearchParams(payload).toString()}` : ''
      }`,
      {
        method,
        headers: {
          Accept: 'application/vnd.github.v3+json',
          Authorization: `token ${this.githubInfo.token}`,
          'User-Agent': 'Joplin Pages Publisher',
          ...(method === 'POST' ? { 'Content-Type': 'application/json' } : null),
        },
        body: method === 'POST' && payload ? JSON.stringify(payload) : null,
      },
    );

    return response.ok ? response.json() : Promise.reject(response.status);
  }

  getRepositoryName() {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }

    return this.githubInfo.repositoryName || this.getDefaultRepositoryName();
  }

  getDefaultRepositoryName() {
    if (!this.githubInfo?.userName) {
      throw new Error('no github info');
    }

    return `${this.githubInfo.userName}.github.io`;
  }

  init(githubInfo: GithubInfo) {
    const oldGithubInfo = this.githubInfo;
    this.githubInfo = cloneDeep(githubInfo);

    if (
      oldGithubInfo?.userName === githubInfo.userName &&
      oldGithubInfo?.token === githubInfo.token &&
      (oldGithubInfo?.repositoryName || '') === (githubInfo.repositoryName || '')
    ) {
      return;
    }

    this.emit(GithubClientEvents.InfoChanged, githubInfo);
    this.githubInfo = githubInfo;
  }

  async createRepository() {
    if (!this.githubInfo?.userName) {
      throw new Error('no userName');
    }

    try {
      await this.request('POST', '/user/repos', {
        name: this.getRepositoryName(),
        description: 'Blog Website By Joplin Pages Publisher',
      });
    } catch (error) {
      try {
        // maybe user create it manually
        await this.request('GET', `/repos/${this.githubInfo.userName}/${this.getRepositoryName()}`);
      } catch {
        throw new PublishError(PublishResults.Fail, error);
      }
    }
  }

  getGithubInfo() {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }
    return this.githubInfo;
  }

  getRepositoryUrl() {
    if (!this.githubInfo) {
      throw new Error('no github info');
    }

    const { userName } = this.githubInfo;
    const repoName = this.getRepositoryName();
    return `https://github.com/${userName}/${repoName}.git`;
  }
}

container.registerSingleton(githubClientToken, Github);
