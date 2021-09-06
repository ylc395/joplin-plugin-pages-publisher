export interface RenderResultPluginAsset {
  name: string;
  mime: string;
  path: string;

  // For built-in Mardown-it plugins, the asset path is relative (and can be
  // found inside the @joplin/renderer package), while for external plugins
  // (content scripts), the path is absolute. We use this property to tell if
  // it's relative or absolute, as that will inform how it's loaded in various
  // places.
  pathIsAbsolute: boolean;
}

interface ResourceInfo {
  localState: { fetch_status: number };
  extension: string;
  item: { mime: string; id: string; encryption_blob_encrypted: number; encryption_applied: number };
}
export type ResourceMap = Record<string, ResourceInfo>;
