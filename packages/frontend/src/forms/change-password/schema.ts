import * as Yup from "yup"

export const schema = Yup.object({
  currentPassword: Yup.string().required('field-required'),
  newPassword: Yup.string().required('field-required'),
})

export type FormValues = Yup.InferType<typeof schema>;
