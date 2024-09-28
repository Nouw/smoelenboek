import * as Yup from "yup";

export const schema = Yup.object({
  email: Yup.string().email().required(),
  firstName: Yup.string().required(),
  lastName: Yup.string().required(),
}) 
