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
