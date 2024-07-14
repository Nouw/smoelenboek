import * as Yup from "yup";

export const schema = Yup.object({
  name: Yup.string().required().default(""),
  league: Yup.string().default("Eredivisie"),
  gender: Yup.string().default("male"),
})
