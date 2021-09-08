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
        'select',
        'multiple-select',
        'textarea',
        'radio',
        'switch',
        'image-picker',
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
      propertyNames: { format: 'validPageUrl' },
    },
    siteFields: { type: 'array', items: FIELD_SCHEMA },
    articleFields: { type: 'array', items: FIELD_SCHEMA },
  },
  required: ['name', 'version', 'pages'],
} as const;
