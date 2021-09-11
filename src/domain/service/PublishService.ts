import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey, Ref, toRaw } from 'vue';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import type { Github } from '../model/Github';
import { AppService } from './AppService';
import { omit } from 'lodash';

export interface Git {
  push: (files: string[], info: Github) => Promise<void>;
}
export const gitClientToken: InjectionToken<Git> = Symbol();

export const token: InjectionKey<PublishService> = Symbol();

@singleton()
export class PublishService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly appService = container.resolve(AppService);
  private readonly git = container.resolve(gitClientToken);
  private files: string[] = [];
  readonly isGenerating = ref(false);
  readonly isPushing = ref(false);
  readonly githubInfo: Ref<Github | null> = ref(null);

  constructor() {
    this.init();
  }

  private async init() {
    this.githubInfo.value = {
      userName: '',
      repositoryName: '',
      email: '',
      token: (await this.joplinDataRepository.getGithubToken()) || '',
      ...(await this.pluginDataRepository.getGithubInfo()),
    };
  }

  saveGithubInfo(githubInfo: Partial<Github>) {
    const githubInfo_ = omit(githubInfo, ['token']);

    return this.pluginDataRepository.saveGithubInfo(
      omit(toRaw(Object.assign(this.githubInfo.value, githubInfo_)), ['token']),
    );
  }

  async generateSite() {
    if (this.isGenerating.value || this.appService.isAppBlocked.value) {
      return;
    }
    this.isGenerating.value = true;

    try {
      const files = await this.appService.app.generateSite();
      this.files = files;
    } catch (error) {
      this.isGenerating.value = false;
      throw error;
    }

    this.isGenerating.value = false;
  }

  async gitPush() {
    if (this.isPushing.value) {
      return;
    }

    if (!this.githubInfo.value) {
      throw new Error('no github info');
    }

    this.isPushing.value = true;
    await this.git.push(this.files, this.githubInfo.value);
    this.isPushing.value = false;
  }
}
