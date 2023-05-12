
export default {
    type: "object",
    properties: {
      Username: { type: 'string' },
      Code: { type: 'string' },
      Password: { type: 'string' }
    },
    required: ['Username', 'Code', "Password"]
  } as const;