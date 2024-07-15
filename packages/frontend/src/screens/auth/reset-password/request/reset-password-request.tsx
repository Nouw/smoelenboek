import React from "react";
import { useTranslation } from "react-i18next";
import { useRequestResetPasswordMutation } from "../../../../api/endpoints/auth.api.ts";
import {
  Box,
  Card,
  CardContent,
  Container,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Formik, FormikProps } from "formik";
import { schema } from "./schema.ts";
import { LoadingButton } from "@mui/lab";
import { FormValues } from "./schema.ts";
import { SnackbarContext } from "../../../../providers/snackbar/snackbar.context.ts";

export const ResetPasswordRequest: React.FC = () => {
  const { t } = useTranslation(["user", "common", "messages"]);

  const [requestResetPassword, { isLoading }] =
    useRequestResetPasswordMutation();

  const { success } = React.useContext(SnackbarContext);

  async function submit(email: string) {
    try {
      await requestResetPassword({ email }).unwrap();

      success(t("messages:auth.password.request-reset"));
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <Box display="flex" flex={1} minWidth="100%">
      <Container>
        <Card>
          <CardContent>
            <Formik<FormValues>
              validationSchema={schema}
              initialValues={{
                email: "",
              }}
              onSubmit={(values, { setSubmitting }) => {
                submit(values.email);
                setSubmitting(false);
              }}
            >
              {(props: FormikProps<FormValues>) => (
                <form onSubmit={props.handleSubmit} noValidate>
                  <Typography variant="h4" textAlign="center">
                    Reset password
                  </Typography>
                  <br />
                  <Stack spacing={2}>
                    <TextField
                      id="email"
                      label={t("user:email")}
                      type="email"
                      value={props.values.email}
                      onChange={props.handleChange}
                      error={props.touched.email && Boolean(props.errors.email)}
                      helperText={props.touched.email && props.errors.email}
                      fullWidth
                    />
                    <LoadingButton
                      type="submit"
                      loading={props.isSubmitting || isLoading}
                    >
                      <span>{t("common:submit")}</span>
                    </LoadingButton>
                  </Stack>
                </form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
};
