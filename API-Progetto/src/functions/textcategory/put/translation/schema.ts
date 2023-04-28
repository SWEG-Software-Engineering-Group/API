export default {
    type: "object",
    properties: {
        Text: { type: 'string' },
        Feedback: { type: 'string' }
    },
    required: ["Text"]
} as const;