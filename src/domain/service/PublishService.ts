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
  PublishResults,
  DEFAULT_GITHUB,
} from '../model/Publishing';
import { AppService, FORBIDDEN } from './AppService';
import { isEmpty, isError, noop, omit, pick, some } from 'lodash';

export enum GeneratorEvents {
  PAGE_GENERATED = 'PAGE_GENERATED',
}

export enum GitEvents {
  PROGRESS = 'PROGRESS',
  MESSAGE = 'MESSAGE',
  TERMINATED = 'TERMINATED',
  INIT_REPO_STATUS_CHANGED = 'INIT_REPO_STATUS_CHANGED',
}

const MESSAGES: Record<string, string | undefined> = {
  [PublishResults.GITHUB_INFO_ERROR]:
    'Something wrong with your Github information(including token). Please check if you provided the correct information.',
  [PublishResults.TERMINATED]: 'Publishing terminated.',
};

export interface Git extends EventEmitter<GitEvents> {
  init: (githubInfo: Github, dir: string) => Promise<void>;
  push: (files: string[], init: boolean) => Promise<void>;
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
  private gitRepoStatus: 'ready' | 'fail' | 'initializing' = 'initializing';
  readonly githubInfo: Ref<Github | null> = ref(null);
  readonly isGenerating = ref(false);
  readonly isPublishing = ref(false);
  readonly outputDir = ref('');
  readonly generatingProgress: Required<GeneratingProgress> = reactive({
    ...initialGeneratingProgress,
  });
  readonly publishingProgress: PublishingProgress = reactive({
    ...initialPublishProgress,
  });

  constructor() {
    this.init();
  }

  private async init() {
    this.git.on(GitEvents.PROGRESS, (e) => this.refreshPublishingProgress(e));
    this.git.on(GitEvents.MESSAGE, (message) => this.refreshPublishingProgress({ message }));
    this.git.on(GitEvents.INIT_REPO_STATUS_CHANGED, (e) => {
      this.gitRepoStatus = e;

      if (this.gitRepoStatus === 'initializing') {
        this.refreshPublishingProgress({
          phase: 'Repo initializing...',
          message: '',
        });
      }
    });

    this.generator.on(GeneratorEvents.PAGE_GENERATED, this.refreshGeneratingProgress.bind(this));

    this.githubInfo.value = {
      ...DEFAULT_GITHUB,
      token: (await this.joplinDataRepository.getGithubToken()) || '',
      ...(await this.pluginDataRepository.getGithubInfo()),
    };
    this.outputDir.value = await this.generator.getOutputDir();

    if (this.isGithubInfoValid.value) {
      this.git.init(toRaw(this.githubInfo.value), this.outputDir.value).catch(noop);
    }
  }

  isGithubInfoValid = computed(() => {
    const requiredKeys: (keyof Github)[] = ['userName', 'email', 'token'];
    const keyInfos = pick(this.githubInfo.value, requiredKeys);

    return Object.keys(keyInfos).length === requiredKeys.length && !some(keyInfos, isEmpty);
  });

  isDefaultRepository = computed(() => {
    if (!this.githubInfo.value) {
      return true;
    }

    const { repositoryName, userName } = this.githubInfo.value;
    return !repositoryName || repositoryName === `${userName}.github.io`;
  });

  async saveGithubInfo(githubInfo: Partial<Github>) {
    const githubInfo_ = omit(githubInfo, ['token']);

    await this.pluginDataRepository.saveGithubInfo(
      omit(toRaw(Object.assign(this.githubInfo.value, githubInfo_)), ['token']),
    );

    if (!this.isGithubInfoValid.value || !this.githubInfo.value) {
      throw new Error('invalid github info');
    }

    this.git.init(toRaw(this.githubInfo.value), this.outputDir.value).catch(noop);
  }

  async generateSite() {
    if (this.isGenerating.value || this.appService.getLatestWarning(FORBIDDEN.GENERATE)) {
      throw new Error('generating!');
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

  async refreshPublishingProgress(progress: Partial<PublishingProgress> = initialPublishProgress) {
    Object.assign(this.publishingProgress, progress);
  }

  stopPublishing() {
    this.isPublishing.value = false;
    this.git.terminate();
  }

  async publish(initGit = false) {
    if (this.isPublishing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('invalid github info');
    }
    const initGit_ = initGit || this.gitRepoStatus === 'fail';

    if (initGit_) {
      this.refreshPublishingProgress();
    }

    this.isPublishing.value = true;

    try {
      await this.git.push(this.files, initGit_);
      this.publishingProgress.result = PublishResults.SUCCESS;
    } catch (error) {
      if (!isError(error)) {
        throw error;
      }

      const { message } = error;

      this.publishingProgress.result =
        message in MESSAGES ? (message as PublishResults) : PublishResults.FAIL;

      this.publishingProgress.message = MESSAGES[message] || message;
    } finally {
      this.isPublishing.value = false;
    }
  }
}
