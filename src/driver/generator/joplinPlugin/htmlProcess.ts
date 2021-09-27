import _sanitizeHtml, { Attributes } from 'sanitize-html';
import { omitBy, difference } from 'lodash';
import type { RenderResultPluginAsset } from '../type';
export function sanitizeMarkdownHtml(html: string) {
  const allSyntaxes = ['mermaid', 'fountain', 'katex', 'hljs'] as const;
  const syntaxes = new Set<string>();
  const sanitizedHtml = _sanitizeHtml(html, {
    allowedTags: false,
    allowedAttributes: false,
    exclusiveFilter({ attribs }) {
      const blackListClass = ['resource-icon', 'joplin-source'];
      return (
        blackListClass.some((blackCls) => attribs['class']?.includes(blackCls)) ||
        attribs.href === ''
      );
    },
    transformTags: {
      '*'(tagName, attribs) {
        if (attribs['class']) {
          for (const name of allSyntaxes) {
            if (attribs['class'].split(/\s+/).includes(name)) {
              syntaxes.add(name === 'hljs' ? 'highlight' : name);
            }
          }
        }

        return {
          tagName,
          attribs: removeInvalidClass(omitBy(attribs, attrFilter)),
        };
      },
    },
  });

  return { sanitizedHtml, syntaxes: [...syntaxes] };
}

function attrFilter(value: unknown, attrName: string) {
  const blackList = ['data-from-md', 'onclick', 'data-resource-id'];
  return blackList.includes(attrName) || attrName.startsWith('data-joplin') || value === '';
}

function removeInvalidClass(attrs: Attributes) {
  if (!attrs['class']) {
    return attrs;
  }

  const blackList = ['inline-code', 'joplin-editable'];
  const classes = attrs['class'].split(/\s+/);
  attrs['class'] = difference(classes, blackList).join(' ');

  if (!attrs['class']) {
    delete attrs['class'];
  }

  return attrs;
}

export function addScriptLinkStyleTags(
  html: string,
  pluginAssets: RenderResultPluginAsset[],
  cssStrings: string[],
) {
  const linkTags = pluginAssets
    .filter(({ name }) => name.endsWith('.css'))
    .map(({ name }) => `<link rel="stylesheet" href="/_markdown_plugin_assets/${name}" />`)
    .join('\n');

  const scriptTags = pluginAssets
    .filter(({ name }) => name.endsWith('.js'))
    .map(({ name }) => `<script src="/_markdown_plugin_assets/${name}"></script>`)
    .join('\n');

  const styleTag = cssStrings.length > 0 ? `<style>${cssStrings.join('\n')}</style>` : '';

  const toInsertStylePos = getLastIndexOfAny(html, ['</head>', '<body>']);
  const toInsertScriptPos = getLastIndexOfAny(html, ['</body>', '</html>']);

  return `${html.slice(0, toInsertStylePos)}${linkTags}${styleTag}${html.slice(
    toInsertStylePos,
    toInsertScriptPos,
  )}${scriptTags}${html.slice(toInsertScriptPos)}`;
}

function getLastIndexOfAny(text: string, keywords: string[]) {
  let pos: number;
  for (const keyword of keywords) {
    if ((pos = text.lastIndexOf(keyword)) > -1) {
      return pos;
    }
  }

  return text.length;
}
