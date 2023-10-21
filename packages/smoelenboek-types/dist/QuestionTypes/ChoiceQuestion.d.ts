import { ChoiceOption } from "./ChoiceOption";
export type ChoiceQuestion = {
    type: "choice";
    id: string;
    options: ChoiceOption[];
};
