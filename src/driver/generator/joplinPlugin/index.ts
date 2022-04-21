import { PageRenderer } from './PageRenderer';
import type { Db } from 'driver/db/joplinPlugin';

export class Generator {
  private readonly pageRenderer: PageRenderer;

  constructor(db: Db) {
    this.pageRenderer = new PageRenderer(db);
  }

  async generateSite() {
    try {
      await this.pageRenderer.init();
      return await this.pageRenderer.outputPages();
    } catch (error) {
      console.warn(error);
      throw error;
    }
  }

  getProgress() {
    return this.pageRenderer.progress;
  }
}
