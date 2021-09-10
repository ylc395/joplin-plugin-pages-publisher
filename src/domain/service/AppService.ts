import { ref, InjectionKey } from 'vue';
import { singleton, InjectionToken, container } from 'tsyringe';

export const appToken: InjectionToken<App> = Symbol();
interface App {
  openModal: (type: 'error' | 'confirm', args: { title?: string; content?: string }) => void;
  quit: () => Promise<void>;
  openNote: (noteId: string) => Promise<void>;
  generateSite: () => Promise<string[]>;
  getOutputDir: () => Promise<string>;
  getGitRepositoryDir: () => Promise<string>;
}

export const token: InjectionKey<AppService> = Symbol();

@singleton()
export class AppService {
  readonly app = container.resolve(appToken);
  readonly isAppBlocked = ref(false);
}
