import React from "react";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { FormValues, UserForm } from "../../../forms/users/user.form";
import { useLoaderData } from "react-router-dom";
import { useUpdateInfoMutation } from "../../../api/endpoints/user.api";
import { UpdateUserDto, User } from "backend";
import { addHours } from "date-fns";

export const UsersInfo: React.FC = () => {
  const { t } = useTranslation(["common", "error", "user"]);
  const { success, error } = React.useContext(SnackbarContext);
  const user = useLoaderData() as User;
  const [trigger] = useUpdateInfoMutation();

  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try { 
      await trigger({ ...values as unknown as UpdateUserDto, birthDate: addHours(values.birthDate, 2), id: user.id }).unwrap();

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
