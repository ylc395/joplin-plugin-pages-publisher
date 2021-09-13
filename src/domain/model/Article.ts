import type { Moment } from 'moment';
import type { Tag, File, Note } from './JoplinData';

export interface Article {
  readonly noteId: string;
  url: string;
  fullUrl?: string;
  content: string;
  htmlContent?: string;
  note?: Required<Note> | null;
  title: string;
  createdAt: number | Moment;
  formattedCreatedAt?: string;
  updatedAt: number | Moment;
  formattedUpdatedAt?: string;
  tags: Tag['title'][];
  images?: File[];
  attachments?: File[];
  published: boolean;
  syncStatus?: 'synced' | 'deleted' | 'diff';
}

export const REQUIRED_KEYS: (keyof Article)[] = [
  'published',
  'noteId',
  'createdAt',
  'updatedAt',
  'tags',
  'content',
  'url',
];

export function getSyncStatus(
  article: Article,
  note: Note | null,
): Required<Article>['syncStatus'] {
  if (!note) {
    return 'deleted';
  }

  return article.content === note.body ? 'synced' : 'diff';
}
