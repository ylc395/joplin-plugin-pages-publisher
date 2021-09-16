import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey, Ref, toRaw, reactive, computed } from 'vue';
import { PluginDataRepository } from '../repository/PluginDataRepository';
import { JoplinDataRepository } from '../repository/JoplinDataRepository';
import {
  Github,
  GeneratingProgress,
  PublishingProgress,
  initialGeneratingProgress,
  initialPublishProgress,
} from '../model/Publishing';
import { AppService, FORBIDDEN } from './AppService';
import { isEmpty, omit, pick, some } from 'lodash';

// todo: use eventEmitter
export interface Git {
  init: (githubInfo: Github) => Promise<void>;
  push: (files: string[], force: boolean) => Promise<void>;
  getProgress: () => Promise<PublishingProgress>;
}

// todo: use eventEmitter
export interface Generator {
  generateSite: () => Promise<string[]>;
  getProgress: () => Promise<GeneratingProgress>;
  getOutputDir: () => Promise<string>;
}

export const gitClientToken: InjectionToken<Git> = Symbol();
export const generatorToken: InjectionToken<Generator> = Symbol();
export const token: InjectionKey<PublishService> = Symbol();

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
  readonly outputDir = ref('');
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
    this.outputDir.value = await this.generator.getOutputDir();

    if (this.isGithubInfoValid.value) {
      this.git.init(this.githubInfo.value);
    }
  }

  isGithubInfoValid = computed(() => {
    const requiredKeys: (keyof Github)[] = ['userName', 'repositoryName', 'email', 'token'];
    const keyInfos = pick(this.githubInfo.value, requiredKeys);

    return Object.keys(keyInfos).length === requiredKeys.length && !some(keyInfos, isEmpty);
  });

  async saveGithubInfo(githubInfo: Partial<Github>) {
    const githubInfo_ = omit(githubInfo, ['token']);

    await this.pluginDataRepository.saveGithubInfo(
      omit(toRaw(Object.assign(this.githubInfo.value, githubInfo_)), ['token']),
    );

    if (!this.githubInfo.value) {
      throw new Error('no github info');
    }

    this.git.init(this.githubInfo.value);
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

  async gitPush(force = false) {
    if (this.isPublishing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('no github info');
    }

    if (force) {
      const branch = this.githubInfo.value?.branch || 'master';
      const confirmed = await new Promise<boolean>((resolve) => {
        this.appService.openModal({
          type: 'confirm',
          title: 'Are you sure?',
          content: `Force Push will replace the ${branch} branch's all commits on Github with commits of ${branch} branch in this machine. Be sure that you do know what you are doing.`,
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
          okButtonProps: { danger: true, type: 'primary' },
        });
      });

      if (!confirmed) {
        return;
      }
    }

    this.isPublishing.value = true;
    await this.refreshPublishingProgress(true);
    this.publishingTimer = setInterval(this.refreshPublishingProgress.bind(this), 100);

    try {
      await this.git.push(this.files, force);
      this.publishingProgress.result = 'success';
    } catch (error) {
      this.publishingProgress.result = 'fail';
      this.publishingProgress.message = (error as Error).message;
    } finally {
      this.isPublishing.value = false;
      clearInterval(this.publishingTimer);
    }
  }
}
