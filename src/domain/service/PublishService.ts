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
  PublishError,
  DEFAULT_GITHUB,
} from '../model/Publishing';
import { AppService, FORBIDDEN } from './AppService';
import { isEmpty, noop, omit, pick, some } from 'lodash';

export enum GeneratorEvents {
  PageGenerated = 'pageGenerated',
}

export enum GitEvents {
  Progress = 'progress',
  Message = 'message',
  Terminated = 'terminated',
  LocalRepoStatusChanged = 'localRepoStatusChanged',
}

export enum LocalRepoStatus {
  Ready,
  Fail,
  Initializing,
  MissingRepository,
}

export enum GithubClientEvents {
  InfoChanged = 'infoChanged',
}

export interface GithubClient extends EventEmitter<GithubClientEvents> {
  init(github: Github): void;
  createRepository(): Promise<void>;
  getRepositoryUrl(): string;
  getRepositoryName(): string;
  getDefaultRepositoryName(): string;
  getGithubInfo(): Readonly<Github>;
}

const PUBLISH_RESULT_MESSAGE: Record<PublishResults, string> = {
  [PublishResults.Terminated]: 'Publishing terminated.',
  [PublishResults.Fail]:
    'This is an unexpected error, you can retry, and report it as a Github issue',
  [PublishResults.Success]: '',
};

export interface Git extends EventEmitter<GitEvents> {
  init: (github: GithubClient, dir: string) => Promise<void>;
  push: (files: string[], init: boolean) => Promise<void>;
  terminate: () => void;
}

export interface Generator extends EventEmitter<GeneratorEvents> {
  generateSite: () => Promise<string[]>;
  getOutputDir: () => Promise<string>;
}

export const gitClientToken: InjectionToken<Git> = Symbol();
export const generatorToken: InjectionToken<Generator> = Symbol();
export const githubClientToken: InjectionToken<GithubClient> = Symbol();
export const token: InjectionKey<PublishService> = Symbol();

@singleton()
export class PublishService {
  private readonly pluginDataRepository = new PluginDataRepository();
  private readonly joplinDataRepository = new JoplinDataRepository();
  private readonly appService = container.resolve(AppService);
  private readonly generator = container.resolve(generatorToken);
  private readonly git = container.resolve(gitClientToken);
  private readonly github = container.resolve(githubClientToken);
  private files: string[] = [];
  private readonly localRepoStatus: Ref<LocalRepoStatus> = ref(LocalRepoStatus.Initializing);
  readonly repositoryName = ref('');

  readonly isRepositoryMissing = computed(
    () => this.localRepoStatus.value === LocalRepoStatus.MissingRepository,
  );
  readonly isDefaultRepository = computed(
    () => this.repositoryName.value === this.github.getDefaultRepositoryName(),
  );
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
    this.outputDir.value = await this.generator.getOutputDir();
    this.git.init(this.github, this.outputDir.value).catch(noop);

    this.git.on(GitEvents.Progress, this.refreshPublishingProgress.bind(this));
    this.git.on(GitEvents.Message, (message) => this.refreshPublishingProgress({ message }));
    this.git.on(GitEvents.LocalRepoStatusChanged, this.handleLocalRepoStatusChanged.bind(this));
    this.generator.on(GeneratorEvents.PageGenerated, this.refreshGeneratingProgress.bind(this));

    this.githubInfo.value = {
      ...DEFAULT_GITHUB,
      token: (await this.joplinDataRepository.getGithubToken()) || '',
      ...(await this.pluginDataRepository.getGithubInfo()),
    };

    this.initGithubClient();
  }
  private async initGithubClient() {
    if (!this.isGithubInfoValid.value || !this.githubInfo.value) {
      return;
    }

    this.github.init(toRaw(this.githubInfo.value));
    this.repositoryName.value = this.github.getRepositoryName();
  }

  private handleLocalRepoStatusChanged(status: LocalRepoStatus) {
    this.localRepoStatus.value = status;

    if (status === LocalRepoStatus.Initializing) {
      this.refreshPublishingProgress({
        phase: 'Local repository initializing...',
        message: '',
      });
    }
  }

  isGithubInfoValid = computed(() => {
    const requiredKeys: (keyof Github)[] = ['userName', 'email', 'token'];
    const keyInfos = pick(this.githubInfo.value, requiredKeys);

    return Object.keys(keyInfos).length === requiredKeys.length && !some(keyInfos, isEmpty);
  });

  async saveGithubInfo(githubInfo: Partial<Github>) {
    const githubInfo_ = omit(githubInfo, ['token']);

    Object.assign(this.githubInfo.value, githubInfo_);
    await this.pluginDataRepository.saveGithubInfo(omit(toRaw(this.githubInfo.value), ['token']));
    this.initGithubClient();
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

  async publish(needToCreateRepo = false) {
    if (this.isPublishing.value) {
      return;
    }

    if (!this.isGithubInfoValid.value) {
      throw new Error('invalid github info');
    }

    const needToInit =
      this.publishingProgress.result === PublishResults.Fail ||
      needToCreateRepo ||
      this.localRepoStatus.value === LocalRepoStatus.Fail;

    if (needToInit) {
      this.refreshPublishingProgress();
    }

    this.isPublishing.value = true;

    try {
      if (needToCreateRepo && this.isRepositoryMissing.value) {
        await this.github.createRepository();
      }

      await new Promise((resolve) => setTimeout(resolve, 3000)); // a 3s delay, so user can terminate
      await this.git.push(this.files, needToInit);
      this.publishingProgress.result = PublishResults.Success;
    } catch (error) {
      if (error instanceof PublishError) {
        const message = `${error.message || ''} ${PUBLISH_RESULT_MESSAGE[error.type]}`.trim();
        this.publishingProgress.result = error.type;
        this.publishingProgress.message = message;
      } else {
        throw error;
      }
    } finally {
      this.isPublishing.value = false;
    }
  }
}
