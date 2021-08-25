import type { Moment } from 'moment';
import { Tag, File } from './JoplinData';

export interface Article {
  readonly noteId: string;
  url: string;
  content: string;
  noteContent?: string;
  title: string;
  createdAt: number | Moment;
  updatedAt: number | Moment;
  tags: Tag['title'][];
  images?: File[];
  attachments?: File[];
  published: boolean;
  coverImg: string | null;
}
