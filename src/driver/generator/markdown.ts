import { MarkupToHtml } from '@joplin/renderer';
import { find, trimStart } from 'lodash';
import type { Article } from '../../domain/model/Article';
import {
  PLUGIN_SETTING_PREFIX,
  AUDIO_PLAYER_PLUGIN,
  VIDEO_PLAYER_PLUGIN,
  PDF_VIEWER_PLUGIN,
} from './utils';
import { ResourceMap } from './type';

export async function renderMarkdown(
  rawText: string,
  articlePageUrl: string,
  pluginOptions: Record<string, unknown>,
  allResources: ResourceMap,
  allArticles: Article[],
) {
  const resourceIds: string[] = [];
  const getResourceInfo = (url: string) => allResources[trimStart(url, ':/')];
  const ResourceModel = {
    isResourceUrl: (url: string) => Boolean(getResourceInfo(url)),
    urlToId: (url: string) => trimStart(url, ':/'),
    isSupportedImageMimeType: () => true,
  };
  const markupToHtml = new MarkupToHtml({ ResourceModel });

  const { html, pluginAssets } = await markupToHtml.render(1, rawText, null, {
    pluginOptions,
    bodyOnly: true,
    resources: allResources,
    audioPlayerEnabled: pluginOptions[`${PLUGIN_SETTING_PREFIX}${AUDIO_PLAYER_PLUGIN}`],
    videoPlayerEnabled: pluginOptions[`${PLUGIN_SETTING_PREFIX}${VIDEO_PLAYER_PLUGIN}`],
    pdfViewerEnabled: pluginOptions[`${PLUGIN_SETTING_PREFIX}${PDF_VIEWER_PLUGIN}`],
    itemIdToUrl(resourceId: string) {
      const resourceInfo = getResourceInfo(resourceId);
      if (!resourceInfo) {
        // is note id
        const article = find(allArticles, { noteId: resourceId });
        return article ? `/${articlePageUrl}/${article.url}` : '';
      }
      resourceIds.push(resourceId);
      return `/_resources/${resourceId}.${resourceInfo.extension}`;
    },
  });

  return { resourceIds, html, pluginAssets };
}
