import React from "react";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { UserForm } from "../../../forms/users/user.form";
import { useCreateUserMutation } from "../../../api/endpoints/user.api";
import { CreateUserDto } from "backend";

export const UsersCreate: React.FC = () => {
  const { t } = useTranslation(["common", "error", "user"]);
  const { success, error } = React.useContext(SnackbarContext);
  const [trigger] = useCreateUserMutation();
  //
  async function submit(values: { [p: string]: never; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      await trigger(values as unknown as CreateUserDto).unwrap();

      success(t("user:create-user"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
    return
  }

  return <UserForm submit={submit} header={t("user:create-user")} />
}
