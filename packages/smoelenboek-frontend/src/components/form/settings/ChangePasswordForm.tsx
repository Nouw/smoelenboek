import React from "react";
import {Formik} from "formik";
import {Box, IconButton, Stack, TextField} from "@mui/material";
import {useTranslation} from "react-i18next";
import {LoadingButton} from "@mui/lab";
import {useChangePasswordMutation} from "../../../api/endpoints/auth";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {Visibility, VisibilityOff} from "@mui/icons-material";

interface ChangePasswordFormProps {

}

interface FormValues {
  currentPassword: string;
  newPassword: string;
}

export const ChangePasswordForm: React.FC<ChangePasswordFormProps> = () => {
  const { t } = useTranslation();
  const snackbar = React.useContext(SnackbarContext);

  const [trigger] = useChangePasswordMutation()

  const [currentPasswordVisible, setCurrentPasswordVisible] = React.useState<boolean>(false);
  const [newPasswordVisible, setNewPasswordVisible] = React.useState<boolean>(false);

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      await trigger({ newPassword: values.newPassword, currentPassword: values.currentPassword}).unwrap();

      snackbar.openSnackbar(t("message.settings.success"), Severity.SUCCESS);
      // eslint-disable-next-line
    } catch (e: any) {
      console.error(e);

      if (e.data?.message) {
        snackbar.openSnackbar(e.data.message, Severity.ERROR);
      } else {
        snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      }
    }

    values.setSubmitting(false);
  }

  return (
    <Formik<FormValues> initialValues={{currentPassword: '', newPassword: ''}} onSubmit={(values, { setSubmitting }) => {
      submit({...values, setSubmitting})
    }}>
      {props => (
        <form onSubmit={props.handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="currentPassword"
              label={t("settings.currentPassword")}
              value={props.values.currentPassword}
              onChange={props.handleChange}
              error={props.touched.currentPassword && Boolean(props.errors.currentPassword)}
              helperText={props.touched.currentPassword && props.errors.currentPassword}
              type={currentPasswordVisible ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}>
                    {currentPasswordVisible ? <VisibilityOff/> : <Visibility/>}
                  </IconButton>
                )
              }}
            />
            <TextField
              id="newPassword"
              label={t("settings.newPassword")}
              value={props.values.newPassword}
              onChange={props.handleChange}
              error={props.touched.newPassword && Boolean(props.errors.newPassword)}
              helperText={props.touched.newPassword && props.errors.newPassword}
              type={newPasswordVisible ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setNewPasswordVisible(!newPasswordVisible)}>
                    {newPasswordVisible ? <VisibilityOff/> : <Visibility/>}
                  </IconButton>
                )
              }}
            />
            <Box>
              <LoadingButton type="submit" loading={props.isSubmitting}>
                <span>{t("save")}</span>
              </LoadingButton>
            </Box>
          </Stack>
        </form>
      )}
    </Formik>
  )
}
