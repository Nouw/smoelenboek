import { User } from "backend";
import * as Yup from "yup";

export const schema = Yup.object({
  streetName: Yup.string().required("field-required").default(""),
  houseNumber: Yup.string().required("field-required").default(""),
  postcode: Yup.string().required("field-required").default(""),
  city: Yup.string().required("field-required").default(""),
  email: Yup.string().required("field-required").default(""),
  phoneNumber: Yup.string().required("field-required").default(""),
  bankaccountNumber: Yup.string().required("field-required").default(""),
  backNumber: Yup.number().default(0),
})

export const stripToSchema = (user: User) => {
  const corr = schema.cast({});

  const result = {};

  for (const key of Object.keys(corr)) {
    //@ts-expect-error Whatever;
    result[key] = user[key];
  }

  return result; 
}
