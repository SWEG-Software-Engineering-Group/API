interface TextCategory {
    idTenant: string;
    language_category_title: string;
    text: string;
    stato: number;
}
enum state {
    testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { TextCategory, state };