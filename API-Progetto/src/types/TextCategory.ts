interface TextCategory {
  idTenant: string;
  language_category_title: string;
  text: string;
  state: number;
}
enum state {
  testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { TextCategory, state };