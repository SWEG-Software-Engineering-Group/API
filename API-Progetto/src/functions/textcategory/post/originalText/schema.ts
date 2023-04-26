export default {
  type: "object",
  properties: {
      Title: { type: 'string' },
      Category: { type: 'string' },
      Text: { type: 'string' },
      Comment: { type: 'string' },
      Link: { type: 'string' },
      Languages: { type: 'Array' [ 'string' ]}
  },
  required: ["Title", "Category", "Text", "Languages"]
} as const;