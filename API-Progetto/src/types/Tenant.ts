interface Tenant {
  id: string;
  tenantName: string;
  admins: Array<string>;
  users: Array<string>;
  creationDate: number;
  languages: Array<string>;
  defaultLanguage: string;
  categories: Array<string>;
}/*
interface Category {
  id: string;
  name: string;
}*/

export { Tenant, /*Category */ };