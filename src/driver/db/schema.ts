import { REQUIRED_KEYS } from '../../domain/model/Article';

export const ARTICLE_SCHEMA = {
  type: 'object',
  properties: {
    published: { type: 'boolean' },
    noteId: { type: 'string' },
    createdAt: { type: 'number' },
    updatedAt: { type: 'number' },
    tags: { type: 'array', items: { type: 'string' } },
    content: { type: 'string' },
    url: { type: 'string' },
    title: { type: 'string' },
  },
  required: REQUIRED_KEYS,
} as const;
