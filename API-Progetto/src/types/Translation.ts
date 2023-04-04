import { state } from "./Text";
interface Translation {
    Tenant: string;
    ID: string;
    language: string;
    category: string;
    state: state;
    feedback: string | null;
}

export { Translation };