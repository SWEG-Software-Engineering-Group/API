export default {
    type: "object",
    properties: {
        Category: { type: 'string' },
        Text: { type: 'string' },
        Comment: { type: 'string' },
        Link: { type: 'string' },
    },
    required: ["Category", "Text"]
} as const;