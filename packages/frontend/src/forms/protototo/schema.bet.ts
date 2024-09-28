import * as Yup from "yup";

export const schema = Yup.object({
  setOne: Yup.boolean().default(true),
  setTwo: Yup.boolean().default(true),
  setThree: Yup.boolean().default(true),
  setFour: Yup.boolean(),
  setFive: Yup.boolean(),
}) 
