import React from "react";
import {Field, useField} from "formik";
import {Card, CardContent, FormControlLabel, Stack, Switch, TextField} from "@mui/material";
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
                {({form: { touched, errors,  }}) => (
                  <DateTimePicker
                    label={"date"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(dateFieldProps.value)}
                    onChange={(value) => dateFieldHelpers.setValue(value!.toDate(), true)}
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
              <Field name="openRegistration">
                {({form: { touched, errors,  }}) => (
                  <DateTimePicker
                    label={"openRegistration"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(openRegistrationFieldProps.value)}
                    onChange={(value) => openRegistrationFieldHelpers.setValue(value!.toDate(), true)}
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
              <Field name="closeRegistration">
                {({form: { touched, errors,  }}) => (
                  <DateTimePicker
                    label={"closeRegistration"}
                    format="HH:mm DD-MM-YYYY"
                    value={moment(closeRegistrationFieldProps.value)}
                    onChange={(value) => closeRegistrationFieldHelpers.setValue(value!.toDate(), true)}
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
            </Stack>
          </CardContent>
        </Card>
  )
}
