import * as Yup from "yup";
import i18n from "../../../utilities/i18n/i18n";

export type FormValues = Yup.InferType<typeof schema>;

export const schema = Yup.object({
  password: Yup.string()
    .required(i18n.t("message.auth.required.password"))
    .min(2, "Password must be longer than 2 characters"),
});
