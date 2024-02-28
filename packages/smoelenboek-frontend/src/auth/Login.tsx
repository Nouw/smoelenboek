import React from "react";
import {
  Box, Button,
  Card,
  CardContent,
  Container,
  IconButton, Link,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {Visibility, VisibilityOff} from "@mui/icons-material";
import * as Yup from 'yup';
import {Formik, FormikProps} from "formik";
import {LoadingButton} from "@mui/lab";
import {useAppDispatch, useAppSelector} from "../store/hooks";
import {setCredentials, setLanguage, setRoles} from "../store/feature/auth.slice";
import {useNavigate} from "react-router-dom";
import {useLoginMutation} from "../api/endpoints/auth";
import {useTranslation} from "react-i18next";
import GB from "../assets/gb.svg";
import NL from "../assets/nl.svg";

interface LoginProps {

}

interface FormValues {
  email: string,
  password: string
}



export const Login: React.FC<LoginProps> = () => {
  const { t } = useTranslation();

  const language = useAppSelector((state) => state.auth.language);

  const [showPassword, setShowPassword] = React.useState<boolean>(false)

  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation()

  React.useEffect(() => {
    if (auth.refreshToken) {
      navigate("/teams/female");
    }
  }, [auth.refreshToken, navigate])

  const schema = Yup.object({
    email: Yup.string().required(t("message.auth.required.email")).email('Please enter a valid email address'),
    password: Yup.string().required(t("message.auth.required.password")).min(2, 'Password must be longer than 2 characters')
  })

  const submit = async (data: { email: string, password: string }) => {
    try {
      const res = await login(data).unwrap();

      dispatch(setCredentials(res.data));
      dispatch(setRoles(res.data.roles));

      navigate('/')
    } catch (e) {
      console.error(e);
    }
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
                  password: ""
                }}
                onSubmit={(values) => {
                  submit({email: values.email, password: values.password})
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
                      <TextField
                        id="password"
                        label={t("password")}
                        type={showPassword ? "text" : "password"}
                        value={props.values.password}
                        error={props.touched.password && Boolean(props.errors.password)}
                        helperText={props.touched.password && props.errors.password}
                        onChange={props.handleChange}
                        InputProps={{
                          endAdornment: (
                            <IconButton onClick={() => setShowPassword(!showPassword)}>
                              {showPassword ? <VisibilityOff/> : <Visibility/>}
                            </IconButton>
                          )
                        }}
                      />
                      <Link href="/password/reset">
                        <Typography variant="caption" color={theme => theme.palette.primary.main}>
                          {t("auth.forgotPassword")}?
                        </Typography>
                      </Link>
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
  )
}
