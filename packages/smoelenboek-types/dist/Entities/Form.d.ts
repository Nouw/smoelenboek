import { SerializedLexicalNode } from "lexical";
import { FormItem } from "../FormItem";
export declare class Form {
    id: string;
    name: string;
    description?: SerializedLexicalNode;
    registrationOpen: Date;
    registrationClosed: Date;
    formItem: FormItem;
    sheetLink?: string;
}
