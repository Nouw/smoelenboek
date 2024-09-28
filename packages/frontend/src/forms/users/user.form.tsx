import React from "react";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { Box, Card, CardContent, Stack, TextField, Typography } from "@mui/material";
import { Field, Formik, FormikProps } from "formik";
import { LoadingButton } from "@mui/lab";
import { schema } from "./schema";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { parse } from "date-fns";

export type FormValues = Yup.InferType<typeof schema>;

type UsersInfoProps = {
  initialValues?: FormValues,
  submit: (values: { [p: string]: any, setSubmitting: (isSubmitting: boolean) => void }) => void,
  header?: string,
}

export const UserForm: React.FC<UsersInfoProps> = ({ initialValues: baseValues, submit, header }) => {
  const { t } = useTranslation(["common", "error", "user"]);
  const initialValues = schema.cast(baseValues)

  function convertDate(date: string | Date): Date {
    if (typeof date === 'string' || date instanceof String) {
      return parse(date as string, "yyyy-MM-dd", new Date());
    }

    return date;
  }

  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            submit({ ...values, setSubmitting });
          }}>
          {(props: FormikProps<FormValues>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{header ?? t("user:update-user")}</Typography>
              <br />
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
                  id="backNumber"
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
                  {({ form: { touched, errors } }) => (
                    <>
                      <DatePicker
                        label={t("user:birthdate")}
                        format="dd-MM-yyyy"
                        value={convertDate(props.values.birthDate)}
                        onChange={(value: Date) => props.setFieldValue("birthDate", value, true)}
                        slotProps={{
                          textField: {
                            variant: 'outlined',
                            error: touched.birthDate && Boolean(errors.birthDate),
                            helperText: <p>{errors.birthDate}</p>
                          }
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
