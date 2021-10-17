import { container } from 'tsyringe';
import EventEmitter from 'eventemitter3';
import type { GeneratingProgress } from 'domain/model/Publishing';
import { generatorToken, GeneratorEvents } from 'domain/service/PublishService';
import { isEqual } from 'lodash';
export interface GeneratorRequest {
  event: 'generateSite' | 'getGeneratingProgress' | 'getOutputDir';
}
declare const webviewApi: {
  postMessage: <T = void>(payload: GeneratorRequest) => Promise<T>;
};

class Generator extends EventEmitter<GeneratorEvents> {
  private timer?: ReturnType<typeof setInterval>;

  async generateSite() {
    this.timer = setInterval(this.queryProgress.bind(this), 100);
    try {
      const files = await webviewApi.postMessage<string[]>({ event: 'generateSite' });
      clearInterval(this.timer);
      return files;
    } catch (error) {
      clearInterval(this.timer);
      throw error;
    }
  }

  getOutputDir() {
    return webviewApi.postMessage<string>({ event: 'getOutputDir' });
  }

  private lastProgress?: GeneratingProgress;
  private async queryProgress() {
    const progress = await webviewApi.postMessage<GeneratingProgress>({
      event: 'getGeneratingProgress',
    });
    if (!isEqual(this.lastProgress, progress)) {
      this.emit(GeneratorEvents.PageGenerated, progress);
      this.lastProgress = progress;
    }
  }
}

container.registerSingleton(generatorToken, Generator);
