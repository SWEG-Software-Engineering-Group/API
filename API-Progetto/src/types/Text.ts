interface Text {
    idTenant: string;
    languageIdtextId: string;
    stato: number;
    feedback: string | null;
}

enum state {
    testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { Text, state };