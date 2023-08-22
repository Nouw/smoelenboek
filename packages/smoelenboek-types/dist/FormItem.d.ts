import { ChoiceQuestion } from "./QuestionTypes/ChoiceQuestion";
import { TextQuestion } from "./QuestionTypes/TextQuestion";
import { SelectQuestion } from "./QuestionTypes/SelectQuestion";
import { Section } from "./QuestionTypes/Section";
export declare type FormItem = {
    id: string;
    sections: Section[];
};
export declare type FormQuestion = {
    id: string;
    required: boolean;
    title: string;
    description: string;
    question: ChoiceQuestion | TextQuestion | SelectQuestion;
};
