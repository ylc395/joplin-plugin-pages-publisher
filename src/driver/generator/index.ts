import { PageRenderer } from './PageRenderer';

const pageRenderer = new PageRenderer();
export async function generateSite() {
  try {
    await pageRenderer.init();
    return await pageRenderer.outputPages();
  } catch (error) {
    console.warn(error);
    throw error;
  }
}

export function getProgress() {
  return pageRenderer.progress;
}
