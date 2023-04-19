export default {
  type: "object",
  properties: {
    tenantName: { type: 'string' },
    defaultLanguage: { type: 'string' },
    creationDate: { type: 'number' },
    languages: { type: "array", items: { type: "string" } },
    admins: { type: "array", items: { type: "string" } },
    users: { type: "array", items: { type: "string" } },
    //categories: { type: "array", items: { type: "string" } }
  },
  required: ['tenantName', 'defaultLanguage', "creationDate", "languages", "admins", "users", /*"categories"*/]
} as const;