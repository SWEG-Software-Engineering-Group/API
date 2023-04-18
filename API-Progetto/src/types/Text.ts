import { Category } from "./Tenant";
import { state } from "./TextCategory";
interface Text{
    idTenant: string;
    language: string;
    category: Category;
    title: string;
    text: string;
    stato: state;
    comment: string | null;
    link: string | null;
    feedback: string | null;
}
export { Text };