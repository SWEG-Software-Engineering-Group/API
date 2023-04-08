interface Text {
    idTenant: string;
    languageIdtextId: string;
    text:string,
    stato: number;
    feedback: string | null;
}

enum state {
    testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { Text, state };