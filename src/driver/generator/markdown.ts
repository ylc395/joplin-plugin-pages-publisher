import { MarkupToHtml } from '@joplin/renderer';

const markupToHtml = new MarkupToHtml();

export function renderMarkdown(
  rawText: string,
  pluginOptions: Record<string, unknown>,
): Promise<{ html: string }> {
  return markupToHtml.render(1, rawText, null, {
    audioPlayerEnabled: false,
    videoPlayerEnabled: false,
    pdfViewerEnabled: false,
    pluginOptions,
    resources: {},
  });
}
