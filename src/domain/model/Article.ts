import { Tag, File } from './JoplinData';

export interface Article {
  readonly noteId: string;
  url: string;
  content: string;
  noteContent?: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  tags: Tag['title'][];
  images?: File[];
  attachments?: File[];
  published: boolean;
  sourceStatus?: 'same' | 'diff' | 'deleted';
}
