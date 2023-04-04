import { state } from "./Text";
interface Translation {
    ID: string;
    language: string;
    category: string;
    state: state;
    feedback: string | null;
}

export { Translation };