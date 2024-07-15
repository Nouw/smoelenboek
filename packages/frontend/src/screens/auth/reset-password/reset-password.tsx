import React from "react";
import { useTranslation } from "react-i18next";
import { useResetPasswordMutation } from "../../../api/endpoints/auth.api.ts";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context.ts";
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
import { FormValues, schema } from "./schema.ts";
import { LoadingButton } from "@mui/lab";
import { useParams, useSearchParams } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export const ResetPassword: React.FC = () => {
  const { t } = useTranslation(["user", "common", "messages"]);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const { success } = React.useContext(SnackbarContext);

  async function submit(password: string) {
    try {
      await resetPassword({ password, token }).unwrap();

      success(t("messages:auth.password.success"));
    } catch (e) {
      console.error(e);
    }
  }

  if (!token) {
    throw new Response("Token is not valid!", { status: 403 });
  }

  return (
    <Box display="flex" flex={1} minWidth="100%">
      <Container>
        <Card>
          <CardContent>
            <Formik<FormValues>
              validationSchema={schema}
              initialValues={{
                password: "",
              }}
              onSubmit={(values, { setSubmitting }) => {
                submit(values.password);
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
                      id="password"
                      label={t("user:password")}
                      type={showPassword ? "text" : "password"}
                      value={props.values.password}
                      error={
                        props.touched.password && Boolean(props.errors.password)
                      }
                      helperText={
                        props.touched.password && props.errors.password
                      }
                      onChange={props.handleChange}
                      InputProps={{
                        endAdornment: (
                          <IconButton
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        ),
                      }}
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
