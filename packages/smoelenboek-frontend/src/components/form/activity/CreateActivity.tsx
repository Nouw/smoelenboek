

import React from "react";
import {Field, useField, FormikErrors, FormikTouched} from "formik";
import {Card, CardContent, Stack, TextField} from "@mui/material";
import {StyledTextInput} from "../StyledTextInput.tsx";
import {DateTimePicker} from "@mui/x-date-pickers/DateTimePicker";
import moment from "moment";

interface CreateActivityProps {
  name: string;
}

export const CreateActivity: React.FC<CreateActivityProps> = ({ name }) => {
  const [titleFieldProps, , titleFieldHelpers] = useField(`${name}.title`);
  const [descriptionFieldProps, , descriptionFieldHelpers] = useField(`${name}.description`)
  const [locationFieldProps, , locationFieldHelpers] = useField(`${name}.location`);
  const [openRegistrationFieldProps, , openRegistrationFieldHelpers] = useField(`${name}.registrationOpen`);
  const [closeRegistrationFieldProps, , closeRegistrationFieldHelpers] = useField(`${name}.registrationClosed`);
  const [maxFieldProps, , maxFieldHelpers] = useField(`${name}.max`);
  const [dateFieldProps, ,dateFieldHelpers] = useField(`${name}.date`);

  return (
        <Card>
          <CardContent>
            <Stack direction="column" gap={2}>
              <TextField label="Title" fullWidth value={titleFieldProps.value} onChange={(e) => titleFieldHelpers.setValue(e.target.value)} />
              <StyledTextInput value={descriptionFieldProps.value ?? ""} onChange={(value) => descriptionFieldHelpers.setValue(value)} height={200} />
              <TextField label="Location" fullWidth value={locationFieldProps.value} onChange={(e) => locationFieldHelpers.setValue(e.target.value)} />
              <TextField label="Maximum" fullWidth value={maxFieldProps.value} onChange={(e) => maxFieldHelpers.setValue(e.target.value)} type="number" />
              <Field name="date">
                {({form: { touched, errors,  }} : {form: { touched: FormikTouched<any>, errors: FormikErrors<any>}}) => (
                  <DateTimePicker
                    label={"date"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(dateFieldProps.value)}
                    onChange={(value) => dateFieldHelpers.setValue(value!.toDate(), true)}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: touched.startDate && Boolean(errors.startDate),
                        helperText:(errors.startDate && typeof errors.startDate === 'string') ? <p>{errors.startDate}</p> : null
                      }}
                    }
                    viewRenderers={{
                      // hours: renderTimeViewClock,
                      // minutes: renderTimeViewClock,
                    }}
                    ampm={false}
                  />
                )}
              </Field>
              <Field name="registrationOpen">
                {({form: { touched, errors,  }} : {form: { touched: FormikTouched<any>, errors: FormikErrors<any>}}) => (
                  <DateTimePicker
                    label={"openRegistration"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(openRegistrationFieldProps.value)}
                    onChange={(value) => openRegistrationFieldHelpers.setValue(value!.toDate(), true)}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: touched.registrationOpen && Boolean(errors.registrationOpen),
                        helperText:(errors.registrationOpen && typeof errors.registrationOpen === 'string') ? <p>{errors.registrationOpen}</p> : null }
                    }}
                    viewRenderers={{
                      // hours: renderTimeViewClock,
                      // minutes: renderTimeViewClock,
                    }}
                    ampm={false}
                  />
                )}
              </Field>
              <Field name="registrationClosed">
                {({form: { touched, errors,  }} : {form: { touched: FormikTouched<any>, errors: FormikErrors<any>}}) => (
                  <DateTimePicker
                    label={"closeRegistration"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(closeRegistrationFieldProps.value)}
                    onChange={(value) => closeRegistrationFieldHelpers.setValue(value!.toDate(), true)}
                    slotProps={{
                      textField: {
                        variant: 'outlined',
                        error: touched.registrationClosed && Boolean(errors.registrationClosed),
                        helperText: (errors.registrationClosed && typeof errors.registrationClosed === 'string') ? <p>{errors.registrationClosed}</p> : null }
                    }}
                    viewRenderers={{
                      // hours: renderTimeViewClock,
                      // minutes: renderTimeViewClock,
                    }}
                    ampm={false}
                  />
                )}
              </Field>
            </Stack>
          </CardContent>
        </Card>
  )
}
