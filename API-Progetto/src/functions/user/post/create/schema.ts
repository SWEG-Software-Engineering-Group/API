
export default {
    type: "object",
    properties: {
      email: { type: 'string' },
      password: { type: 'string' },
      name: { type: 'string' },
      surname: { type: 'string' },
      group: { type: 'string' }
    },
    required: ['email', 'password', "name", "surname","group"]
  } as const;