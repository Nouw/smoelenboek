import * as Yup from "yup";
import {Field, Formik, FormikProps, FormikValues} from "formik";
import moment from "moment";
import {useTranslation} from "react-i18next";
import {Box, Card, CardContent, Stack, Typography} from "@mui/material";
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import {LoadingButton} from "@mui/lab";

export interface SeasonFormValues extends FormikValues {
  startDate: moment.Moment,
  endDate: moment.Moment,
}

type SeasonFormProps<T> = {
   
  schema: Yup.ObjectSchema<any>,
  initialValues: T
   
  submit: (values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) => void,
  heading?: string,
  fields?: (props: FormikProps<T>) => JSX.Element[] | JSX.Element,
}

export const SeasonForm = <T extends SeasonFormValues,>({ schema, initialValues, submit, heading, fields } : SeasonFormProps<T>) => {
  const { t } = useTranslation(["common", "season"]);

  return (
    <Card>
      <CardContent>
        <Formik<T>
          validationSchema={schema}
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => {
            submit({...values, setSubmitting })
          }}>
          {(props: FormikProps<T>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{heading}</Typography>
              <br/>
              <Stack spacing={2}>
                <Field name="startDate">
                   {/*eslint-disable-next-line @typescript-eslint/ban-ts-comment*/}
                   {/*@ts-ignore*/}
                  {({form: { touched, errors,  }}) => (
                    <DateTimePicker
                      label={t("season:start-date")}
                      format="HH:mm DD-MM-YYYY"
                      value={props.values.startDate}
                      onChange={(value) => props.setFieldValue("startDate", value, true)}
                      slotProps={{
                        textField: {
                          variant: 'outlined',
                          error: touched.startDate && Boolean(errors.startDate),
                          helperText: <p>{errors.startDate}</p> }
                      }}
                      viewRenderers={{
                        // hours: renderTimeViewClock,
                        // minutes: renderTimeViewClock,
                      }}
                      ampm={false}
                    />
                  )}
                </Field>
                <Field name="endDate">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <>
                      <DateTimePicker
                        label={t("season:end-date")}
                        format="HH:mm DD-MM-YYYY"
                        value={props.values.endDate}
                        onChange={(value) => props.setFieldValue("endDate", value, true)}
                        slotProps={{
                          textField: {
                            variant: 'outlined',
                            error: touched.endDate && Boolean(errors.endDate),
                            helperText: <p>{errors.endDate}</p> }
                        }}
                        viewRenderers={{
                          // hours: renderTimeViewClock,
                          // minutes: renderTimeViewClock,
                          // seconds: renderTimeViewClock,
                        }}
                        ampm={false}
                      />
                    </>
                  )}
                </Field>
                <>
                  {fields !== undefined &&
                    fields(props)
                  }
                </>
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
