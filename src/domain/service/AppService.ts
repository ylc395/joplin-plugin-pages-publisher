import { InjectionToken } from 'tsyringe';

export interface AppService {
  quit: () => Promise<void>;
  openNote: (noteId: string) => Promise<void>;
  generateSite: () => Promise<string[]>;
  getDataDir: () => Promise<string>;
}

export const token: InjectionToken<AppService> = Symbol();
