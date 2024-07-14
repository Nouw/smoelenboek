import React from "react";
import { Formik } from "formik";
import { Box, IconButton, Stack, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { FormValues, schema } from "./schema";
import { useChangePasswordMutation } from "../../api/endpoints/auth.api";
import { SnackbarContext } from "../../providers/snackbar/snackbar.context";

export const ChangePassword: React.FC = () => {
  const { t } = useTranslation(["settings", "common", "error", "messages"]);
  const { success, error }= React.useContext(SnackbarContext);

  const [trigger] = useChangePasswordMutation()

  const [currentPasswordVisible, setCurrentPasswordVisible] = React.useState<boolean>(false);
  const [newPasswordVisible, setNewPasswordVisible] = React.useState<boolean>(false);

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    try {
      await trigger({ newPassword: values.newPassword, currentPassword: values.currentPassword }).unwrap();

      success(t("messages:settings.success"));
    } catch (e: any) {
      console.error(e);
      
      error(t('error:error-message'));
    }

    values.setSubmitting(false);
  }

  return (
    <Formik<FormValues> initialValues={{ currentPassword: '', newPassword: '' }} validationSchema={schema} onSubmit={(values, { setSubmitting }) => {
      submit({ ...values, setSubmitting })
    }}>
      {props => (
        <form onSubmit={props.handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="currentPassword"
              label={t("settings:current-password")}
              value={props.values.currentPassword}
              onChange={props.handleChange}
              error={props.touched.currentPassword && Boolean(props.errors.currentPassword)}
              helperText={props.touched.currentPassword && Boolean(props.errors.currentPassword) && t(`form:${props.errors.currentPassword}`)}
              type={currentPasswordVisible ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setCurrentPasswordVisible(!currentPasswordVisible)}>
                    {currentPasswordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <TextField
              id="newPassword"
              label={t("settings:new-password")}
              value={props.values.newPassword}
              onChange={props.handleChange}
              error={props.touched.newPassword && Boolean(props.errors.newPassword)}
              helperText={props.touched.newPassword && Boolean(props.errors.newPassword) && t(`form:${props.errors.newPassword}`)}
              type={newPasswordVisible ? "text" : "password"}
              InputProps={{
                endAdornment: (
                  <IconButton onClick={() => setNewPasswordVisible(!newPasswordVisible)}>
                    {newPasswordVisible ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                )
              }}
            />
            <Box>
              <LoadingButton type="submit" loading={props.isSubmitting}>
                <span>{t("common:save")}</span>
              </LoadingButton>
            </Box>
          </Stack>
        </form>
      )}
    </Formik>
  )
}
