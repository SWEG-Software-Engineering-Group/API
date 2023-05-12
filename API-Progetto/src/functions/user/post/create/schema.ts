
export default {
    type: "object",
    properties: {
      Email: { type: 'string' },
      Password: { type: 'string' },
      Name: { type: 'string' },
      Surname: { type: 'string' },
      Group: { type: 'string' }
    },
    required: ['Email', 'Password', "Name", "Surname","Group"]
  } as const;