import { state } from "./Text";
interface Translation {
    ID: string;
    language: string;
    category: string;
    state: state;
    feedback: string | null;
}

function isTranslation(object: any): object is Translation {
    return object;
}

export { Translation, isTranslation };