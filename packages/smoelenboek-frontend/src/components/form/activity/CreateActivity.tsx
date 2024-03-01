import React from "react";
import { Field, FormikErrors, FormikTouched, useField } from "formik";
import { Card, CardContent, Stack, TextField } from "@mui/material";
import { StyledTextInput } from "../StyledTextInput.tsx";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { boolean, date, number, object, string } from "yup";
import { FormValues } from "../../../screens/dashboard/activity/Create.tsx";

interface CreateActivityProps {
  name: string;
}

export const activity = object({
  title: string().required("field-required"),
  description: string().nullable(),
  location: string().nullable(),
  public: boolean().default(() => true),
  registrationOpen: date().default(() => new Date()),
  registrationClosed: date().when(
    "registrationOpen",
    (registrationOpen, schema) =>
      registrationOpen && schema.min(registrationOpen, "registration-closed-after-open"),
  ),
  max: number().nullable().min(0),
  date: date().required().when(
    "registrationClosed",
    (registrationClosed, schema) =>
      registrationClosed && (schema.min(registrationClosed, "date-after-registration-closed")),
  ),
});

export const CreateActivity: React.FC<CreateActivityProps> = ({ name }) => {
  const { t } = useTranslation(["common", "activity", "form"]);

  const [titleFieldProps, titleFieldMeta, titleFieldHelpers] = useField(
    `${name}.title`,
  );
  const [descriptionFieldProps, , descriptionFieldHelpers] = useField(
    `${name}.description`,
  );
  const [locationFieldProps, locationFieldMeta, locationFieldHelpers] =
    useField(
      `${name}.location`,
    );
  const [openRegistrationFieldProps, , openRegistrationFieldHelpers] = useField(
    `${name}.registrationOpen`,
  );
  const [closeRegistrationFieldProps, , closeRegistrationFieldHelpers] =
    useField(`${name}.registrationClosed`);
  const [maxFieldProps, , maxFieldHelpers] = useField(`${name}.max`);
  const [dateFieldProps, , dateFieldHelpers] = useField(`${name}.date`);

  return (
    <Card>
      <CardContent>
        <Stack direction="column" gap={2}>
          <TextField
            label={t("activity:title")}
            fullWidth
            value={titleFieldProps.value}
            onChange={(e) => titleFieldHelpers.setValue(e.target.value)}
            error={Boolean(titleFieldMeta.error)}
            helperText={Boolean(titleFieldMeta.error) && t(`form:${titleFieldMeta.error}`)}
          />
          <StyledTextInput
            value={descriptionFieldProps.value ?? ""}
            onChange={(value) => descriptionFieldHelpers.setValue(value)}
            height={200}
          />
          <TextField
            label={t("activity:location")}
            fullWidth
            value={locationFieldProps.value}
            onChange={(e) => locationFieldHelpers.setValue(e.target.value)}
            error={Boolean(locationFieldMeta.error)}
            helperText={locationFieldMeta.touched && locationFieldMeta.error}
          />
          <TextField
            label={t("activity:maximum")}
            fullWidth
            value={maxFieldProps.value}
            onChange={(e) => maxFieldHelpers.setValue(e.target.value)}
            type="number"
          />
          <Field name="date">
            {(
              { form: { errors } }: {
                form: {
                  errors: FormikErrors<FormValues>;
                };
              },
            ) => (
              <DateTimePicker
                label={t("activity:date")}
                format="HH:mm DD-MM-YYYY"
                value={moment(dateFieldProps.value)}
                onChange={(value) =>
                  dateFieldHelpers.setValue(value!.toDate(), true)}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    error: Boolean(errors.activity?.date),
                    helperText: errors.activity?.date && <p>{t(`form:${errors.activity?.date}`)}</p>  
                  },
                }}
                viewRenderers={{
                  // hours: renderTimeViewClock,
                  // minutes: renderTimeViewClock,
                }}
                ampm={false}
              />
            )}
          </Field>
          <Field name="registrationOpen">
            {(
              { form: { errors } }: {
                form: {
                  errors: FormikErrors<FormValues>;
                };
              },
            ) => (
              <DateTimePicker
                label={t("activity:registration-open")}
                format="HH:mm DD-MM-YYYY"
                value={moment(openRegistrationFieldProps.value)}
                onChange={(value) =>
                  openRegistrationFieldHelpers.setValue(value!.toDate(), true)}
                slotProps={{
                  textField: {
                    variant: "outlined",
                    error: Boolean(errors.activity?.registrationOpen),
                    helperText:
                      (errors.activity?.registrationOpen && (
                        <p>{errors.activity.registrationOpen}</p>
                      )),
                  },
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
            {(
              { form: { errors } }: {
                form: {
                  errors: FormikErrors<FormValues>;
                };
              },
            ) => {
              return (
                <DateTimePicker
                  label={t("activity:registration-closed")}
                  format="HH:mm DD-MM-YYYY"
                  value={moment(closeRegistrationFieldProps.value)}
                  onChange={(value) =>
                    closeRegistrationFieldHelpers.setValue(
                      value!.toDate(),
                      true,
                    )}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: Boolean(errors.activity?.registrationClosed),
                      helperText:
                        (errors.activity?.registrationClosed && (
                          <p>{t(`form:${errors.activity.registrationClosed}`)}</p>
                        )),
                    },
                  }}
                  viewRenderers={{
                    // hours: renderTimeViewClock,
                    // minutes: renderTimeViewClock,
                  }}
                  ampm={false}
                />
              );
            }}
          </Field>
        </Stack>
      </CardContent>
    </Card>
  );
};
