import {Action} from "../Action";

export type ChoiceOption = {
  value: string,

  goToAction?: Action,
  goToSection?: string,
}
