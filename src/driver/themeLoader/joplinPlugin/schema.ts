const FIELD_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string', pattern: '^[^_]' },
    label: { type: 'string' },
    tip: { type: 'string' },
    required: { type: 'boolean' },
    inputType: {
      enum: [
        'input',
        'menu',
        'select',
        'multiple-select',
        'textarea',
        'markdown',
        'radio',
        'switch',
        'number',
        'checkbox',
        'date',
      ],
    },
  },
  required: ['name'],
} as const;

export const THEME_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    version: { type: 'string' },
    pages: {
      type: 'object',
      additionalProperties: { type: 'array', items: FIELD_SCHEMA },
      propertyNames: { format: 'validPageName' },
    },
    siteFields: { type: 'array', items: FIELD_SCHEMA },
    articleFields: { type: 'array', items: FIELD_SCHEMA },
  },
  required: ['pages'],
} as const;
