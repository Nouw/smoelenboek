import i18n from "../../../../utilities/i18n/i18n.ts";
import * as Yup from "yup";

export type FormValues = Yup.InferType<typeof schema>;

export const schema = Yup.object({
  email: Yup.string()
    .required(i18n.t("message.auth.required.email"))
    .email("Please enter a valid email address"),
});
