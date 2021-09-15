import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey, Ref, toRaw, reactive, computed } from 'vue';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import type { Github, GeneratingProgress, PublishingProgress } from '../model/Publishing';
import { AppService, FORBIDDEN } from './AppService';
import { isEmpty, omit, pick, some } from 'lodash';

export interface Git {
  push: (files: string[], info: Github) => Promise<void>;
  getProgress: () => Promise<PublishingProgress>;
}

export interface Generator {
  generateSite: () => Promise<string[]>;
  getProgress: () => Promise<GeneratingProgress>;
}

export const gitClientToken: InjectionToken<Git> = Symbol();
export const generatorToken: InjectionToken<Generator> = Symbol();

export const token: InjectionKey<PublishService> = Symbol();

const initialGeneratingProgress: Required<GeneratingProgress> = {
  totalPages: 0,
  generatedPages: 0,
  result: null,
  message: '',
};

export const initialPublishProgress: PublishingProgress = {
  phase: '',
  message: '',
  loaded: 0,
  total: 0,
};

@singleton()
export class PublishService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly appService = container.resolve(AppService);
  private readonly generator = container.resolve(generatorToken);
  private readonly git = container.resolve(gitClientToken);
  private files: string[] = [];
  private generatingTimer: number | null = null;
  private publishingTimer: number | null = null;
  readonly githubInfo: Ref<Github | null> = ref(null);
  readonly isGenerating = ref(false);
  readonly isPublishing = ref(false);
  readonly generatingProgress: Required<GeneratingProgress> = reactive({
    ...initialGeneratingProgress,
  });
  readonly publishingProgress: Required<PublishingProgress> = reactive({
    ...initialPublishProgress,
    result: null,
  });

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
    await this.refreshGeneratingProgress(true);

    try {
      this.generatingTimer = setInterval(this.refreshGeneratingProgress.bind(this), 100);
      const files = await this.generator.generateSite();
      this.files = files;
      this.generatingProgress.result = 'success';
      this.generatingProgress.message = `${files.length} files in totals`;
    } catch (error) {
      this.generatingProgress.result = 'fail';
      this.generatingProgress.message = (error as Error).message;
    } finally {
      this.isGenerating.value = false;
      if (this.generatingTimer) {
        clearInterval(this.generatingTimer);
      }
      this.refreshGeneratingProgress();
    }
  }

  async refreshGeneratingProgress(reset = false) {
    Object.assign(
      this.generatingProgress,
      reset ? initialGeneratingProgress : await this.generator.getProgress(),
    );
  }

  async refreshPublishingProgress(reset = false) {
    Object.assign(
      this.publishingProgress,
      reset ? { ...initialPublishProgress, result: null } : await this.git.getProgress(),
    );
  }

  async gitPush() {
    if (this.isPublishing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('no github info');
    }
    this.isPublishing.value = true;
    await this.refreshPublishingProgress(true);
    this.publishingTimer = setInterval(this.refreshPublishingProgress.bind(this), 100);

    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await this.git.push(this.files, this.githubInfo.value!);
      this.publishingProgress.result = 'success';
    } catch (error) {
      this.publishingProgress.result = 'fail';
      const message = (error as Error).message;

      this.publishingProgress.message = message.includes('401')
        ? `${message}. Probably your token is invalid.`
        : message;
    } finally {
      this.isPublishing.value = false;
      clearInterval(this.publishingTimer);
    }
  }
}
