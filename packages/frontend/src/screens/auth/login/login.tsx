import React from "react";
import { Formik, FormikProps } from "formik";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Container, IconButton, Stack, TextField, Typography } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import * as Yup from "yup";
import { schema } from "./schema";
import { useLoginMutation } from "../../../api/endpoints/auth.api";
import { login as sliceLogin } from "../../../store/slices/auth.slice";
import { useAppDispatch } from "../../../store/hooks";

type FormValues = Yup.InferType<typeof schema>;

export const Login: React.FC = () => {
  const { t } = useTranslation(["user", "common"]);

  const [login, { isLoading }] = useLoginMutation()
  const [showPassword, setShowPassword] = React.useState<boolean>(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  async function submit(email: string, password: string) {
    try {
      const res = await login({ email, password }).unwrap();

      dispatch(sliceLogin(res));

      navigate("/")
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
                password: ""
              }}
              onSubmit={(values) => {
                submit(values.email, values.password)
              }}>
              {(props: FormikProps<FormValues>) => (
                <form onSubmit={props.handleSubmit} noValidate>
                  <Typography variant="h4" textAlign="center">Login</Typography>
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
                    <TextField
                      id="password"
                      label={t("user:password")}
                      type={showPassword ? "text" : "password"}
                      value={props.values.password}
                      error={props.touched.password && Boolean(props.errors.password)}
                      helperText={props.touched.password && props.errors.password}
                      onChange={props.handleChange}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={() => setShowPassword(!showPassword)}>
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        )
                      }}
                      fullWidth
                    />
                    <Link href="/password/reset">
                      <Typography variant="caption" color={theme => theme.palette.primary.main}>
                        {t("user:forgot-password")}?
                      </Typography>
                    </Link>
                    <LoadingButton type="submit" loading={props.isSubmitting || isLoading}>
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
  )
}
