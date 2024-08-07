import React from "react";
import moment from "moment";
import {Box, Card, CardContent, Stack, TextField, Typography} from "@mui/material";
import {Field, Formik, FormikProps} from "formik";
import {DatePicker} from "@mui/x-date-pickers/DatePicker";
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {LoadingButton} from "@mui/lab";
import {useCreateMemberMutation, useUpdateMemberMutation} from "../../../api/endpoints/members";
import {User} from "smoelenboek-types";
import {useAppDispatch} from "../../../store/hooks";
import {addMembers, updateMembers} from "../../../store/feature/members.slice";
import {useTranslation} from "react-i18next";

interface UserFormProps {
  method: 'put' | 'post',
  message: string,
  baseValues?: FormValues,
  admin?: boolean
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  streetName: string;
  houseNumber: string;
  postcode: string;
  city: string;
  phoneNumber: string;
  bankaccountNumber: string;
  bondNumber: string;
  backNumber: number;
  birthDate: moment.Moment | string
}

// const schema = Yup.object({
//   firstName: Yup.string().required(),
//   lastName: Yup.string().required(),
//   email: Yup.array().of(Yup.string().email()).required(),
//   streetName: Yup.string().required(),
//   houseNumber: Yup.string().required(),
//   postCode: Yup.string().length(6).matches(/^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-z]{2}$/i).required(),
//   city: Yup.string().required(),
//   phoneNumber: Yup.string().required(),
//   bankaccountNumber: Yup.string(),
//   bondNumber: Yup.string(),
//   backNumber: Yup.number(),
//   birthDate: Yup.date()
// });



export const UserForm: React.FC<UserFormProps> = ({ method, message, baseValues, admin }) => {
  const { t } = useTranslation(["common", "error", "user"]);
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();

  const [updateMember] = useUpdateMemberMutation();
  const [createMember] = useCreateMemberMutation();

  const initialValues: FormValues = baseValues ?? {
    backNumber: 0,
    bankaccountNumber: "",
    birthDate: moment(),
    bondNumber: "",
    city: "",
    email: "",
    firstName: "",
    houseNumber: "",
    lastName: "",
    phoneNumber: "",
    postcode: "",
    streetName: ""
  }

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      if (method === 'put') {
        const res = await updateMember({ admin: admin ?? false, user: values as unknown as User}).unwrap();

        dispatch(updateMembers([res.data]));
      } else {
        const res = await createMember(values as unknown as User).unwrap();

        dispatch(addMembers([res.data]));
      }

      snackbar.openSnackbar(message, Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
      values.setSubmitting(false);
    }

    return
  }

  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => {
            submit({...values, setSubmitting});
          }}>
          {(props: FormikProps<FormValues>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{method === 'put' ? t("user:update-user") : t("user:create-user")}</Typography>
              <br/>
              <Stack spacing={2}>
                <TextField
                  id="firstName"
                  label={t("user:first-name")}
                  value={props.values.firstName}
                  onChange={props.handleChange}
                  error={props.touched.firstName && Boolean(props.errors.firstName)}
                  helperText={props.touched.firstName && props.errors.firstName}
                />
                <TextField
                  id="lastName"
                  label={t("user:last-name")}
                  value={props.values.lastName}
                  onChange={props.handleChange}
                  error={props.touched.lastName && Boolean(props.errors.lastName)}
                  helperText={props.touched.lastName && props.errors.lastName}
                />
                <TextField
                  id="email"
                  label={t("user:email")}
                  type="email"
                  value={props.values.email}
                  onChange={props.handleChange}
                  error={props.touched.email && Boolean(props.errors.email)}
                  helperText={props.touched.email && props.errors.email}
                />
                <TextField
                  id="phoneNumber"
                  label={t("user:phone-number")}
                  value={props.values.phoneNumber}
                  onChange={props.handleChange}
                  error={props.touched.phoneNumber && Boolean(props.errors.phoneNumber)}
                  helperText={props.touched.phoneNumber && props.errors.phoneNumber}
                />
                <TextField
                  id="streetName"
                  label={t("user:street-name")}
                  value={props.values.streetName}
                  onChange={props.handleChange}
                  error={props.touched.streetName && Boolean(props.errors.streetName)}
                  helperText={props.touched.streetName && props.errors.streetName}
                />
                <TextField
                  id="houseNumber"
                  label={t("user:house-number")}
                  value={props.values.houseNumber}
                  onChange={props.handleChange}
                  error={props.touched.houseNumber && Boolean(props.errors.houseNumber)}
                  helperText={props.touched.houseNumber && props.errors.houseNumber}
                />
                <TextField
                  id="postcode"
                  label={t("user:postcode")}
                  value={props.values.postcode}
                  onChange={props.handleChange}
                  error={props.touched.postcode && Boolean(props.errors.postcode)}
                  helperText={props.touched.postcode && props.errors.postcode}
                />
                <TextField
                  id="city"
                  label={t("user:city")}
                  value={props.values.city}
                  onChange={props.handleChange}
                  error={props.touched.city && Boolean(props.errors.city)}
                  helperText={props.touched.city && props.errors.city}
                />
                <TextField
                  id="bankaccountNumber"
                  label={t("user:IBAN")}
                  value={props.values.bankaccountNumber}
                  onChange={props.handleChange}
                  error={props.touched.bankaccountNumber && Boolean(props.errors.bankaccountNumber)}
                  helperText={props.touched.bankaccountNumber && props.errors.bankaccountNumber}
                />
                <TextField
                  id="bondNumber"
                  label={t("user:bond-number")}
                  value={props.values.bondNumber}
                  onChange={props.handleChange}
                  error={props.touched.bondNumber && Boolean(props.errors.bondNumber)}
                  helperText={props.touched.bondNumber && props.errors.bondNumber}
                />
                <TextField
                  id="backNumer"
                  label={t("user:back-number")}
                  type="number"
                  value={props.values.backNumber}
                  onChange={props.handleChange}
                  error={props.touched.backNumber && Boolean(props.errors.backNumber)}
                  helperText={props.touched.backNumber && props.errors.backNumber}
                />
                <Field name="birthDate">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <>
                      <DatePicker
                        label={t("user:birthdate")}
                        format="DD-MM-YYYY"
                        value={moment(props.values.birthDate)}
                        onChange={(value) => props.setFieldValue("birthDate", value, true)}
                        slotProps={{
                          textField: {
                            variant: 'outlined',
                            error: touched.birthDate && Boolean(errors.birthDate),
                            helperText: <p>{errors.birthDate}</p> }
                        }}
                      />
                    </>
                  )}
                </Field>
                <Box>
                  <LoadingButton type="submit" loading={props.isSubmitting}>
                    <span>{t("common:save")}</span>
                  </LoadingButton>
                </Box>
              </Stack>
            </form>
          )}

        </Formik>

      </CardContent>
    </Card>
  )
}
