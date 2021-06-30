// This is a Joplin Plugin Project, so Joplin Data Types are of core business models
// other models are derived from Joplin data types more or less.

// @see https://joplinapp.org/api/references/rest_api/#notes
export interface Note {
  id: string;
  title: string;
  user_created_time: number;
  user_updated_time: number;
  body?: string;
}

// @see https://joplinapp.org/api/references/rest_api/#tags
export interface Tag {
  id: string;
  title: string;
}

// @see https://joplinapp.org/api/references/rest_api/#resources
export interface Resource {
  id: string;
  mime: string;
}

export interface File {
  attachmentFilename: string;
  body: Uint8Array;
  contentType: string;
}
