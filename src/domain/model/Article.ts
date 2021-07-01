import { Tag, File } from './JoplinData';

export interface Article {
  readonly noteId: string;
  title: string;
  publishedAt?: Date;
  createdAt: number;
  updatedAt: number;
  tags: Tag['title'][];
  images: File[];
  attachments: File[];
  published: boolean;
  sourceStatus: 'normal' | 'updated' | 'deleted';
}
