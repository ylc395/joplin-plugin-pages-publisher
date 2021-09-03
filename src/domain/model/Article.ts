import type { Moment } from 'moment';
import { Tag, File } from './JoplinData';

export interface Article {
  readonly noteId: string;
  url: string;
  fullUrl?: string;
  content: string;
  noteContent?: string;
  title: string;
  createdAt: number | Moment;
  formattedCreatedAt?: string;
  updatedAt: number | Moment;
  formattedUpdatedAt?: string;
  tags: Tag['title'][];
  images?: File[];
  attachments?: File[];
  published: boolean;
  coverImg: string | null;
}
