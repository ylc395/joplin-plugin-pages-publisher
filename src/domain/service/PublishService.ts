import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey, Ref, toRaw, reactive, computed } from 'vue';
import type EventEmitter from 'eventemitter3';
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
import { isEmpty, noop, omit, pick, some } from 'lodash';

export enum GeneratorEvents {
  PAGE_GENERATED = 'PAGE_GENERATED',
}

export enum GitEvents {
  PROGRESS = 'PROGRESS',
  MESSAGE = 'MESSAGE',
  AUTH_FAIL = 'AUTH_FAIL',
}

export interface Git extends EventEmitter<GitEvents> {
  init: (githubInfo: Github, dir: string) => Promise<void>;
  push: (files: string[], force: boolean) => Promise<void>;
  terminate: () => void;
}

export interface Generator extends EventEmitter<GeneratorEvents> {
  generateSite: () => Promise<string[]>;
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
    this.git.on(GitEvents.AUTH_FAIL, () => {
      this.publishingProgress.message = GitEvents.AUTH_FAIL;
    });

    this.git.on(GitEvents.PROGRESS, this.refreshPublishingProgress.bind(this));
    this.git.on(GitEvents.MESSAGE, (e) => {
      this.publishingProgress.message = e;
    });
    this.generator.on(GeneratorEvents.PAGE_GENERATED, this.refreshGeneratingProgress.bind(this));

    this.githubInfo.value = {
      userName: '',
      repositoryName: '',
      email: '',
      token: (await this.joplinDataRepository.getGithubToken()) || '',
      ...(await this.pluginDataRepository.getGithubInfo()),
    };
    this.outputDir.value = await this.generator.getOutputDir();

    if (this.isGithubInfoValid.value) {
      this.git.init(toRaw(this.githubInfo.value), this.outputDir.value).catch(noop);
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

    if (!this.isGithubInfoValid.value || !this.githubInfo.value) {
      throw new Error('invalid github info');
    }

    this.git.init(this.githubInfo.value, this.outputDir.value);
  }

  async generateSite() {
    if (this.isGenerating.value || this.appService.getLatestWarning(FORBIDDEN.GENERATE)) {
      return;
    }

    this.isGenerating.value = true;
    this.refreshGeneratingProgress();

    try {
      const files = await this.generator.generateSite();
      this.files = files;
      this.generatingProgress.result = 'success';
      this.generatingProgress.message = `${files.length} files in totals`;
    } catch (error) {
      this.generatingProgress.result = 'fail';
      this.generatingProgress.message = (error as Error).message;
    } finally {
      this.isGenerating.value = false;
    }
  }

  async refreshGeneratingProgress(progress: GeneratingProgress = initialGeneratingProgress) {
    Object.assign(this.generatingProgress, progress);
  }

  async refreshPublishingProgress(progress: PublishingProgress = initialPublishProgress) {
    Object.assign(this.publishingProgress, progress);
  }

  stopPublishing() {
    this.isPublishing.value = false;
    this.refreshPublishingProgress();
    this.git.terminate();
  }

  async publish(force = false) {
    if (this.isPublishing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('invalid github info');
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

    this.refreshPublishingProgress();
    this.isPublishing.value = true;

    try {
      await this.git.push(this.files, force);
      this.publishingProgress.result = 'success';
    } catch (error) {
      this.publishingProgress.result = 'fail';
      this.publishingProgress.message = (error as Error).message;
    } finally {
      this.isPublishing.value = false;
    }
  }
}
