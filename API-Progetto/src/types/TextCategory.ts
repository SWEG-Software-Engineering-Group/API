interface TextCategory {
  idTenant: string;
  languageidCategorytextId: string;
  txt: string;
  stato: number;
}
enum state {
  testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { TextCategory, state };