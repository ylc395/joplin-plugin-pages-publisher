import { MarkupToHtml } from 'joplin-renderer';
import joplin from 'api';

const markupToHtml = new MarkupToHtml();

export async function getJoplinMarkdownSetting() {
  // @see https://github.com/laurent22/joplin/blob/1bc674a1f9a1f5021142d040459ef127db71ee62/packages/lib/models/Setting.ts#L873
  const pluginNames = [
    'softbreaks',
    'typographer',
    'linkify',
    'katex',
    'fountain',
    'mermaid',
    'mark',
    'footnote',
    'toc',
    'sub',
    'sup',
    'deflist',
    'abbr',
    'emoji',
    'insert',
    'multitable',
  ];

  const values = await Promise.all<boolean>(
    pluginNames.map((name) => joplin.settings.globalValue(`markdown.plugin.${name}`)),
  );

  return values.reduce((result, value, i) => {
    if (value) {
      result[pluginNames[i]] = {};
    }

    return result;
  }, {} as Record<string, unknown>);
}

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
