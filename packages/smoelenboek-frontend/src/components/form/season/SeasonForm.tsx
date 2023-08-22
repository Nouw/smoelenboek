import {Box, Card, CardContent, Stack, Typography} from "@mui/material";
import {Field, Formik, FormikProps, FormikValues} from "formik";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import moment from "moment";
import {LoadingButton} from "@mui/lab";
import * as Yup from 'yup';
import {useTranslation} from "react-i18next";

export interface SeasonFormValues extends FormikValues {
  startDate: moment.Moment,
  endDate: moment.Moment,
}


type SeasonFormProps<T> = {
  // eslint-disable-next-line
  schema: Yup.ObjectSchema<any>,
  initialValues: T
  // eslint-disable-next-line
  submit: (values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) => void,
  heading?: string,
  fields?: (props: FormikProps<T>) => JSX.Element[] | JSX.Element,
}


export const SeasonForm = <T extends SeasonFormValues,>({ schema, initialValues, submit, heading, fields } : SeasonFormProps<T>) => {
  const { t } = useTranslation();

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
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore */}
                    {({form: { touched, errors }}) => (
                      <DatePicker
                        label={t("dashboard.season.startDate")}
                        format="DD-MM-YYYY"
                        value={props.values.startDate}
                        onChange={(value) => props.setFieldValue("startDate", value, true)}
                        slotProps={{
                          textField: {
                            variant: 'outlined',
                            error: touched.startDate && Boolean(errors.startDate),
                            helperText: <p>{errors.startDate}</p> }
                        }}
                      />
                    )}
                  </Field>
                  <Field name="endDate">
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore */}
                    {({form: { touched, errors }}) => (
                      <>
                        <DatePicker
                          label={t("dashboard.season.endDate")}
                          format="DD-MM-YYYY"
                          value={props.values.endDate}
                          onChange={(value) => props.setFieldValue("endDate", value, true)}
                          slotProps={{
                            textField: {
                              variant: 'outlined',
                              error: touched.endDate && Boolean(errors.endDate),
                              helperText: <p>{errors.endDate}</p> }
                          }}
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
                      <span>Save</span>
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

