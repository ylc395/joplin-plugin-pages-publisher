import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey, Ref, toRaw, reactive, computed } from 'vue';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import type { Github } from '../model/Github';
import type { GeneratingProgress } from '../model/Site';
import { AppService, FORBIDDEN } from './AppService';
import { isEmpty, omit, pick, some } from 'lodash';

export interface Git {
  push: (files: string[], info: Github) => Promise<void>;
}

export interface Generator {
  generateSite: () => Promise<string[]>;
  getGeneratingProgress: () => Promise<GeneratingProgress>;
}

export const gitClientToken: InjectionToken<Git> = Symbol();
export const generatorToken: InjectionToken<Generator> = Symbol();

export const token: InjectionKey<PublishService> = Symbol();

const initialProgress = {
  totalPages: 0,
  generatedPages: 0,
  result: null,
  reason: '',
};

@singleton()
export class PublishService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly appService = container.resolve(AppService);
  private readonly generator = container.resolve(generatorToken);
  private readonly git = container.resolve(gitClientToken);
  private files: string[] = [];
  readonly isGenerating = ref(false);
  readonly isPushing = ref(false);
  readonly githubInfo: Ref<Github | null> = ref(null);
  readonly progress: Required<GeneratingProgress> = reactive({ ...initialProgress });

  private checkingTimer: number | null = null;

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

  isGithubInfoValid = computed(() => {
    const requiredKeys: (keyof Github)[] = ['userName', 'repositoryName', 'email', 'token'];
    const keyInfos = pick(this.githubInfo.value, requiredKeys);

    return Object.keys(keyInfos).length === requiredKeys.length && !some(keyInfos, isEmpty);
  });

  saveGithubInfo(githubInfo: Partial<Github>) {
    const githubInfo_ = omit(githubInfo, ['token']);

    return this.pluginDataRepository.saveGithubInfo(
      omit(toRaw(Object.assign(this.githubInfo.value, githubInfo_)), ['token']),
    );
  }

  async generateSite() {
    if (this.isGenerating.value || this.appService.getLatestWarning(FORBIDDEN.GENERATE)) {
      return;
    }

    this.isGenerating.value = true;
    this.progress.result = null;

    try {
      this.checkingTimer = setInterval(this.refreshProgress.bind(this), 100);
      const files = await this.generator.generateSite();
      this.files = files;
      this.progress.result = 'success';
      this.progress.reason = String(files.length);
    } catch (error) {
      this.progress.result = 'fail';
      this.progress.reason = (error as Error).message;
    } finally {
      this.isGenerating.value = false;
      if (this.checkingTimer) {
        clearInterval(this.checkingTimer);
      }
      this.refreshProgress();
    }
  }

  async refreshProgress(reset = false) {
    Object.assign(
      this.progress,
      reset ? initialProgress : await this.generator.getGeneratingProgress(),
    );
  }

  async gitPush() {
    if (this.isPushing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('no github info');
    }
    this.isPushing.value = true;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await this.git.push(this.files, this.githubInfo.value!);
    this.isPushing.value = false;
  }
}
