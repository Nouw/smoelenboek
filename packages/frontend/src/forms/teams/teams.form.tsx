import React from "react";
import { useTranslation } from "react-i18next";
import * as Yup from "yup";
import { schema } from "./schema";
import { Box, Card, CardContent, FormControl, FormHelperText, InputLabel, MenuItem, Select, Stack, TextField, Typography } from "@mui/material";
import { Field, Formik } from "formik";
import { LoadingButton } from "@mui/lab";

export type FormValues = Yup.InferType<typeof schema>;

type TeamsFormProps = {
  values?: FormValues,
  submit: ({ values, setSubmitting } : { values: FormValues, setSubmitting: (value: boolean) => void }) => void,
  header?: string,
}

export const TeamsForm: React.FC<TeamsFormProps> = ({ values, submit, header }) => {
  const { t } = useTranslation(["common", "team", "messages", "error", "navigation"]);
  const initialValues = values ?? schema.cast({}); 

  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            submit({ values, setSubmitting })
          }}>
          {(props) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{header ?? t('teams:create-team')}</Typography>
              <br />
              <Stack spacing={2}>
                <TextField
                  id="name"
                  label={t("common:name")}
                  value={props.values.name}
                  onChange={props.handleChange}
                  error={props.touched.name && Boolean(props.errors.name)}
                  helperText={props.touched.name && props.errors.name}
                />
                <Field name="league">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({ form: { touched, errors } }) => (
                    <FormControl fullWidth>
                      <InputLabel id="rank-picker">{t("team:league")}</InputLabel>
                      <Select
                        labelId="rank-picker"
                        label={t("team:league")}
                        value={props.values.league}
                        onChange={(value) => props.setFieldValue("league", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="Eredivisie">Eredivisie</MenuItem>
                        <MenuItem value="Top divisie">Topdivisie</MenuItem>
                        <MenuItem value="Eerste divisie">Eerste divisie</MenuItem>
                        <MenuItem value="Tweede divisie">Tweede divisie</MenuItem>
                        <MenuItem value="Derde divisie">Derde divisie</MenuItem>
                        <MenuItem value="Promotieklasse">Promotieklasse</MenuItem>
                        <MenuItem value="1e Klasse">1e Klasse</MenuItem>
                        <MenuItem value="2e Klasse">2e Klasse</MenuItem>
                        <MenuItem value="3e Klasse">3e Klasse</MenuItem>
                        <MenuItem value="4e Klasse">4e Klasse</MenuItem>
                      </Select>
                      {touched.league && Boolean(errors.league) &&
                        <FormHelperText>{errors.league}</FormHelperText>
                      }
                    </FormControl>
                  )}
                </Field>
                <Field name="gender">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({ form: { touched, errors } }) => (
                    <FormControl fullWidth>
                      <InputLabel id="gender-picker">Type</InputLabel>
                      <Select
                        labelId="gender-picker"
                        label={t("common:type")}
                        value={props.values.gender}
                        onChange={(value) => props.setFieldValue("gender", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="male">{t("navigation:teams.men")}</MenuItem>
                        <MenuItem value="female">{t("navigation:teams.women")}</MenuItem>

                      </Select>
                      {touched.gender && Boolean(errors.gender) &&
                        <FormHelperText>{errors.gender}</FormHelperText>
                      }
                    </FormControl>
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
  );
}
