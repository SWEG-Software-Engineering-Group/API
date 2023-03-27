interface Text {
  text: string;
  stato: number;
  feedback: string | null;
  comment: string | null;
  link: string | null;
}

enum state {
  testoOriginale, daTradurre, daVerificare, verificato, rifiutato
}
export { Text, state };