import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { Field, FieldProps, Formik, FormikProps, FormikValues } from "formik";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LoadingButton } from "@mui/lab";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";
import { constructNow } from "date-fns";

export interface SeasonFormValues extends FormikValues {
  startDate: Date,
  endDate: Date,
}


type SeasonFormProps<T> = {
  schema: Yup.ObjectSchema<any>,
  initialValues: T

  submit: (values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) => void,
  heading?: string,
  fields?: (props: FormikProps<T>) => JSX.Element[] | JSX.Element,
}


export const SeasonForm = <T extends SeasonFormValues,>({ schema, initialValues, submit, heading, fields }: SeasonFormProps<T>) => {
  const { t } = useTranslation(["common", "season"]);
  
  return (
    <Card>
      <CardContent>
        <Formik<T>
          validationSchema={schema}
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => {
            submit({ ...values, setSubmitting })
          }}>
          {(props: FormikProps<T>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{heading}</Typography>
              <br />
              <Stack spacing={2}>
                <Field name="startDate">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({ form: { touched, errors } }) => (
                    <DatePicker
                      label={t("season:start-date")}
                      format="dd-MM-yyyy"
                      value={props.values.startDate}
                      onChange={(e) => props.setFieldValue('startDate', e)}
                      slotProps={{
                        textField: {
                          variant: "outlined",
                          error: touched.startDate && Boolean(errors.startDate),
                          helperText: <p>{errors.startDate}</p>
                        }
                      }}
                    />
                  )}
                </Field>
                <Field name="endDate">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({ form: { touched, errors } }: FieldProps ) => (
                    <>
                      <DatePicker
                        label={t("season:end-date")}
                        format="dd-MM-yyyy"
                        value={props.values.endDate}
                        onChange={(e) => props.setFieldValue('endDate', e)}
                        slotProps={{
                          textField: {
                            variant: "outlined",
                            error: touched.endDate && Boolean(errors.endDate),
                            helperText: <p>{errors.endDate as string}</p>
                          }
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
