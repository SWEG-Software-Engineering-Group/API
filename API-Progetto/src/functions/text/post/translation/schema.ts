export default {
    type: "object",
    properties: {
        Title: { type: 'string' },
        Language: { type: 'string' },
        Category: { type: 'string' },
        Text: { type: 'string' },
        Comment: { type: 'string' },
        Link: { type: 'string' },
    },
    required: ["Title", "Language", "Category", "Text"]
} as const;