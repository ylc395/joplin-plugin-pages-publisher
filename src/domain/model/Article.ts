import { Tag, File } from './JoplinData';

export interface Article {
  readonly noteId: string;
  title: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
  images: File[];
  attachments: File[];
  published: boolean;
  sourceStatus: 'normal' | 'updated' | 'deleted';
}
