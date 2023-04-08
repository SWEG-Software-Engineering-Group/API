interface Tenant {
  id: string;
  tenantName: string;
  admins: Array<string>;
  users: Array<string>;
  creationDate: number;
  languages: Array<string>;
  defaultLanguage: string;
}

export { Tenant };