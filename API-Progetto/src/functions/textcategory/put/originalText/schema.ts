export default {
    type: "object",
    properties: {
        Category: { type: 'string' },
        Text: { type: 'string' },
        Comment: { type: 'string' },
        Link: { type: 'string' },
        Languages: { type: "array", items: { type: "string" } }
    },
    required: ["Category", "Text", "Languages"]
} as const;