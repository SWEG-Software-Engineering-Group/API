export default {
    type: "object",
    properties: {
      username: { type: String },
      password: { type: String },
      email: { type: String },
      role: { type: Number },
      name: { type: String },
      surname: { type: String }
    },
    required: ['username','password','email','role','name','surname']
  } as const;
  