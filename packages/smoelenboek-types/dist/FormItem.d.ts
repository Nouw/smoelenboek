import { ChoiceQuestion } from "./QuestionTypes/ChoiceQuestion";
import { TextQuestion } from "./QuestionTypes/TextQuestion";
import { SelectQuestion } from "./QuestionTypes/SelectQuestion";
import { Section } from "./QuestionTypes/Section";
export type FormItem = {
    id: string;
    sections: Section[];
};
export type FormQuestion = {
    id: string;
    required: boolean;
    title: string;
    description: string;
    question: ChoiceQuestion | TextQuestion | SelectQuestion;
};
