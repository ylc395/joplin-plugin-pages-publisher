import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey } from 'vue';
import type { Github, Git } from '../model/Github';
import { AppService } from './AppService';

export const gitClientToken: InjectionToken<Git> = Symbol();

export const token: InjectionKey<PublishService> = Symbol();

@singleton()
export class PublishService {
  private readonly appService = container.resolve(AppService);
  private readonly git = container.resolve(gitClientToken);
  private files: string[] = [];
  readonly isGenerating = ref(false);
  readonly isPushing = ref(false);
  readonly github: Github = {
    username: 'ylc395',
    email: 'cyl@cyl.moe',
    repositoryName: 'joplin-pages',
    token: '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',
  };

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

    this.isPushing.value = true;
    await this.git.push(this.files, this.github);
    this.isPushing.value = false;
  }
}
