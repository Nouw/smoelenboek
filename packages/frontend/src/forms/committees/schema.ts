import * as Yup from "yup";

export type FormValues = Yup.InferType<typeof schema>;

export const schema = Yup.object({
  name: Yup.string().required('field-required'),
  email: Yup.string(),
})
