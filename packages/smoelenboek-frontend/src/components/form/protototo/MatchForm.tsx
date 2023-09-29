import React from "react";
import moment from "moment";
import {
  Box,
  Card,
  CardContent,
  FormControl, FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {Field, Formik, FormikProps} from "formik";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {LoadingButton} from "@mui/lab";
import {useTranslation} from "react-i18next";

interface MatchFormProps {
  initialValues: FormValues;
  submit: (values: FormValues & { setSubmitting:(submitting: boolean) => void }) => Promise<void> | void;
  title?: string;
}

export interface FormValues {
  playDate: moment.Moment,
  homeTeam: string;
  awayTeam: string;
  gender: "male" | "female"
}


// const schema = Yup.object({
//   playDate: Yup.date().required(),
//   homeTeam: Yup.string().required(),
//   awayTeam: Yup.string().required(),
//   gender: Yup.string().required(),
// })

export const MatchForm: React.FC<MatchFormProps> = ({ initialValues, submit, title }) => {
  const { t } = useTranslation();

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
              <Typography variant="h4">{title}</Typography>
              <br/>
              <Stack spacing={2}>
                <Field name="playDate">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <DateTimePicker
                      label={t("dashboard.protototo.playDate")}
                      format="HH:mm DD-MM-YYYY"
                      value={props.values.playDate}
                      onChange={(value) => props.setFieldValue("playDate", value, true)}
                      slotProps={{
                        textField: {
                          variant: 'outlined',
                          error: touched.playDate && Boolean(errors.playDate),
                          helperText: <p>{errors.playDate}</p> }
                      }}
                      viewRenderers={{
                        // hours: renderTimeViewClock,
                        // minutes: renderTimeViewClock,
                        // seconds: renderTimeViewClock,
                      }}
                      ampm={false}
                    />
                  )}
                </Field>
                <TextField
                  id="homeTeam"
                  label={`${t("dashboard.protototo.home")} team`}
                  value={props.values.homeTeam}
                  onChange={props.handleChange}
                  error={props.touched.homeTeam && Boolean(props.errors.homeTeam)}
                  helperText={props.touched.homeTeam && props.errors.homeTeam}
                />
                <TextField
                  id="awayTeam"
                  label={`${t("dashboard.protototo.away")} team`}
                  value={props.values.awayTeam}
                  onChange={props.handleChange}
                  error={props.touched.awayTeam && Boolean(props.errors.awayTeam)}
                  helperText={props.touched.awayTeam && props.errors.awayTeam}
                />
                <Field name="gender">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <FormControl fullWidth>
                      <InputLabel id="type-picker">Type</InputLabel>
                      <Select
                        labelId="type-picker"
                        label="Type"
                        value={props.values.gender}
                        onChange={(value) => props.setFieldValue("gender", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                      </Select>
                      {touched.gender && Boolean(errors.gender) &&
                          <FormHelperText>{errors.gender}</FormHelperText>
                      }
                    </FormControl>
                  )}
                </Field>
                <Box>
                  <LoadingButton type="submit" loading={props.isSubmitting}>
                    <span>{t("save")}</span>
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
