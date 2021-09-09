import { container, InjectionToken, singleton } from 'tsyringe';
import { ref, InjectionKey } from 'vue';
import type { Github, Git } from '../model/Github';
import { token as appToken } from './AppService';

export const gitClientToken: InjectionToken<Git> = Symbol();

export const token: InjectionKey<PublishService> = Symbol();

@singleton()
export class PublishService {
  private readonly app = container.resolve(appToken);
  private readonly git = container.resolve(gitClientToken);
  readonly isGenerating = ref(false);
  private files: string[] = [];
  readonly github: Github = {
    username: 'ylc395',
    email: 'cyl@cyl.moe',
    repositoryName: 'joplin-pages',
    token: '',
  };

  async generateSite() {
    if (this.isGenerating.value) {
      return;
    }
    this.isGenerating.value = true;

    try {
      const files = await this.app.generateSite();
      this.files = files;
    } catch (error) {
      this.isGenerating.value = false;
      throw error;
    }

    this.isGenerating.value = false;
  }

  gitPush() {
    return this.git.push(this.files, this.github);
  }
}
