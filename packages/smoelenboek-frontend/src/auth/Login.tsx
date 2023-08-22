import React from "react";
import {
  Box,
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
import {setCredentials, setRoles} from "../store/feature/auth.slice";
import {useNavigate} from "react-router-dom";
import {useLazyGetRolesQuery, useLoginMutation} from "../api/endpoints/auth";

interface LoginProps {

}

interface FormValues {
  email: string,
  password: string
}

const schema = Yup.object({
  email: Yup.string().required('An email address is required').email('Please enter a valid email address'),
  password: Yup.string().required("An password is required").min(2, 'Password must be longer than 2 characters')
})

export const Login: React.FC<LoginProps> = () => {
  const [showPassword, setShowPassword] = React.useState<boolean>(false)

  const auth = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [login, { isLoading }] = useLoginMutation()
  const [getRoles] = useLazyGetRolesQuery();

  React.useEffect(() => {
    if (auth.refreshToken) {
      navigate("/teams/female");
    }
  }, [auth.refreshToken, navigate])

  const submit = async (data: { email: string, password: string }) => {
    try {
      const res = await login(data).unwrap();

      dispatch(setCredentials(res.data));

      const rolesRes = await getRoles().unwrap();

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      dispatch(setRoles(rolesRes.data.roles));

      navigate('/')
    } catch (e) {
      console.error(e);
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
                        label="Email address"
                        type="email"
                        value={props.values.email}
                        onChange={props.handleChange}
                        error={props.touched.email && Boolean(props.errors.email)}
                        helperText={props.touched.email && props.errors.email}
                      />
                      <TextField
                        id="password"
                        label="Password"
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
                      <Link href="#">
                        <Typography variant="caption" color={theme => theme.palette.primary.main}>
                          Forgot password?
                        </Typography>
                      </Link>
                      <LoadingButton type="submit" loading={props.isSubmitting || isLoading}>
                        <span>Submit</span>
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
