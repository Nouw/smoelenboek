import { SelectOption } from "./SelectOption";
export type SelectQuestion = {
    type: "select";
    id: number;
    options: SelectOption[];
};
