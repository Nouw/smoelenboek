import React from "react";
import {useTranslation} from "react-i18next";
import {useAppDispatch, useAppSelector} from "../store/hooks.ts";
import * as Yup from 'yup';
import {SnackbarContext} from "../providers/SnackbarContext.ts";
import {Severity} from "../providers/SnackbarProvider.tsx";
import {usePostResetPasswordMutation} from "../api/endpoints/auth.ts";
import {Box, Button, Card, CardContent, Container, Stack, TextField, Typography} from "@mui/material";
import {Formik, FormikProps} from "formik";
import {LoadingButton} from "@mui/lab";
import NL from "../assets/nl.svg";
import GB from "../assets/gb.svg";
import {setLanguage} from "../store/feature/auth.slice.ts";

interface ResetPasswordProps {

}

interface FormValues {
  email: string;
}

export const ResetPassword: React.FC<ResetPasswordProps> = () => {
  const { t } = useTranslation();
  const snackbar = React.useContext(SnackbarContext);

  const [trigger, { isLoading }] = usePostResetPasswordMutation();

  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.auth.language);

  const schema = Yup.object({
    email: Yup.string().required(t("message.auth.required.email")).email('Please enter a valid email address'),
  })

  const submit = async (values: FormValues & { setSubmitting: (submitting: boolean) => void}) => {
    try {
      await trigger(values.email);

      snackbar.openSnackbar(t("emailRequest"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
    }
    values.setSubmitting(false);
  }

  function changeLanguage() {
    if (language === "nl") {
      dispatch(setLanguage("en"))
    } else if (language === "en") {
      dispatch(setLanguage("nl"))
    }
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Container>
        <Card>
          <CardContent>
            <Formik<FormValues>
              validationSchema={schema}
              initialValues={{
                email: "",
              }}
              onSubmit={(values, setSubmitting) => {
                submit({...values, ...setSubmitting})
              }}>
              {(props: FormikProps<FormValues>) => (
                <form onSubmit={props.handleSubmit} noValidate>
                  <Typography variant="h4" textAlign="center">Login</Typography>
                  <br/>
                  <Stack spacing={2}>
                    <TextField
                      id="email"
                      label={t("email")}
                      type="email"
                      value={props.values.email}
                      onChange={props.handleChange}
                      error={props.touched.email && Boolean(props.errors.email)}
                      helperText={props.touched.email && props.errors.email}
                    />
                    <LoadingButton type="submit" loading={props.isSubmitting || isLoading}>
                      <span>{t("submit")}</span>
                    </LoadingButton>
                  </Stack>
                </form>
              )}
            </Formik>
          </CardContent>
        </Card>
      </Container>
      <Box position="absolute" right={5} bottom={5}>
        <Button onClick={() => changeLanguage()}>
          {language === "nl" ? (
            <img src={NL} alt="Flag of NL" height={30}/>
          ) : (
            <img src={GB} alt="Flag of GB" height={30}/>
          )}
        </Button>
      </Box>

    </Box>
  )}
