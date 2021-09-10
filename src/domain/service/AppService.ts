import type { InjectionToken } from 'tsyringe';

interface AppService {
  openModal: (type: 'error' | 'confirm', args: { title?: string; content?: string }) => void;
  quit: () => Promise<void>;
  openNote: (noteId: string) => Promise<void>;
  generateSite: () => Promise<string[]>;
  getOutputDir: () => Promise<string>;
  getGitRepositoryDir: () => Promise<string>;
}

export const token: InjectionToken<AppService> = Symbol();
