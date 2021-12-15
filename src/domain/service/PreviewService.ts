import { container, singleton, InjectionToken } from 'tsyringe';
import { ref, Ref, InjectionKey } from 'vue';

export interface Server {
  start(): Promise<number>;
  close(): Promise<void>;
}

export const serverToken: InjectionToken<Server> = Symbol();

export const token: InjectionKey<PreviewService> = Symbol();

@singleton()
export class PreviewService {
  private readonly server = container.resolve(serverToken);
  readonly port: Ref<number | undefined> = ref();
  readonly message = ref('');
  async startPreviewing() {
    try {
      this.port.value = await this.server.start();
    } catch (error) {
      this.message.value = (error as Error).message;
    }
  }

  reset() {
    this.message.value = '';

    if (this.port.value) {
      this.port.value = undefined;
      return this.server.close();
    }
  }
}
