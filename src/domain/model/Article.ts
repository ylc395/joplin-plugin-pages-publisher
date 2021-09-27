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
  updatedAt: number | Moment;
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
  'title',
];

export function getSyncStatus(article: Partial<Article>): Required<Article>['syncStatus'] {
  if (!article.note) {
    return 'deleted';
  }

  return article.content === article.note.body ? 'synced' : 'diff';
}
