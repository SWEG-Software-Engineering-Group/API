interface OriginalText {
    ID: string;
    language: string;
    category: string;
    comment: string | null;
    link: string | null;
}

function isOriginalText(object: any): object is OriginalText {
    return object;
}

export { OriginalText, isOriginalText};