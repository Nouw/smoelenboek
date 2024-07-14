import * as Yup from "yup";
import i18n from '../../../utilities/i18n/i18n';

export const schema = Yup.object({
  email: Yup.string().required(i18n.t("message.auth.required.email")).email("Please enter a valid email address"),
  password: Yup.string().required(i18n.t("message.auth.required.password")).min(2, "Password must be longer than 2 characters")
})
