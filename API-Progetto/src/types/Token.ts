interface Token {
    name: string;
    idTenant: string;
    privileges:Array<string>;
    value: string;
  }
  
  export { Token };