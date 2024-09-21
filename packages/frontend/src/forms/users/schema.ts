import * as Yup from "yup";

export const schema = Yup.object({
  firstName: Yup.string().required("field-required").default(""),
  lastName: Yup.string().required("field-required").default(""),
  email: Yup.string().email().required("field-required").default(""),
  streetName: Yup.string().required("field-required").default(""),
  houseNumber: Yup.string().required("field-required").default(""),
  postcode: Yup.string().length(6).matches(/^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-z]{2}$/i).required("field-required").default(""),
  city: Yup.string().required("field-required").default(""),
  phoneNumber: Yup.string().required("field-required").default(""),
  bankaccountNumber: Yup.string().default(""),
  bondNumber: Yup.string().default(""),
  backNumber: Yup.number().default(0).nullable(),
  birthDate: Yup.date().default(new Date()),
});
