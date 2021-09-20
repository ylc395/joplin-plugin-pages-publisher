import { Site } from 'domain/model/Site';
import { Article } from 'domain/model/Article';
import _ from 'lodash';
import moment from 'moment';

// copy from @joplin/renderer
export interface RenderResultPluginAsset {
  name: string;
  mime: string;
  path: string;
  pathIsAbsolute: boolean;
}

interface ResourceInfo {
  localState: { fetch_status: number };
  extension: string;
  item: { mime: string; id: string; encryption_blob_encrypted: number; encryption_applied: number };
}
export type ResourceMap = Record<string, ResourceInfo | undefined>;

export interface RenderEnv {
  $page: Record<string, unknown>;
  $site: {
    articles: Article[];
    generatedAt: Required<Site>['generatedAt'];
    [index: string]: unknown;
  };
  _: typeof _;
  _moment: typeof moment;
}
