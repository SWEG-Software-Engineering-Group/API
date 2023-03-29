export default {
  type: "object",
  properties: {
    tenantName: { type: 'string' },
    defaultLanguage: { type: 'string' },
    creationDate: { type: 'int' },
    languages: { type: Array<"string"> },
    admins: { type: Array<"string"> },
    users: { type: Array<"string"> }
  },
  required: ['tenantName', 'defaultLanguage', "creationDate", "languages", "admins", "users"]
} as const;