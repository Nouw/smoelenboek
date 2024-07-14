import React from "react";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { FormValues, UserForm } from "../../../forms/users/user.form";
import { useLoaderData } from "react-router-dom";
import { useCreateUserMutation } from "../../../api/endpoints/user.api";
import { CreateUserDto, User } from "backend";

export const UsersInfo: React.FC = () => {
  const { t } = useTranslation(["common", "error", "user"]);
  const { success, error } = React.useContext(SnackbarContext);
  const user = useLoaderData() as User;
  const [trigger] = useCreateUserMutation(); 
  //
  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      await trigger(values as unknown as CreateUserDto).unwrap(); 

      success(t("user:update-user"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
    return
  }

  return <UserForm initialValues={user as unknown as FormValues} submit={submit} /> 
}
