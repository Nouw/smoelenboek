import React from "react";
import {Formik, FormikProps} from "formik";
import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup, FormHelperText,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {useTranslation} from "react-i18next";
import {LoadingButton} from "@mui/lab";
import * as Yup from "yup";

interface ExternalInformationProps {
  tikkie?: string;
  submit: (values: FormValues & { setSubmitting:(submitting: boolean) => void }) => Promise<void> | void;
}

export interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  acceptAVG: boolean;
  showTikkie: boolean;
  tikkie?: boolean;
}

export const ExternalInformation: React.FC<ExternalInformationProps> = ({ tikkie, submit }) => {
  const { t } = useTranslation(["common", "form", "protototo", "user", "message"]);

  const schema = Yup.object({
		email: Yup.string().required(t("form:field-required")).email(t("messages:valid.email")),
    acceptAVG: Yup.boolean().oneOf([true], t("form:field-required")),
    firstName: Yup.string().required(t("form:field-required")),
    lastName: Yup.string().required(t("form:field-required")),
    showTikkie: Yup.boolean(),
    tikkie: Yup.boolean().when("showTikkie", (showTikkie, schema) => {
      if (showTikkie) {
        return schema.required(t("form:field-required"))
      }

      return schema;
    })
  })

  return <Formik<FormValues> initialValues={{
    email: '',
    acceptAVG: false,
    firstName: '',
    lastName: '',
    showTikkie: tikkie !== undefined
  }} validationSchema={schema} onSubmit={(values, { setSubmitting }) => {
    submit({...values, setSubmitting});
  }}>
    {(props: FormikProps<FormValues>) => (
      <form onSubmit={props.handleSubmit} noValidate>
        <Stack spacing={2}>
          <Typography variant="h4" textAlign="center">{t("protototo:details")}</Typography>
          <TextField
            id="firstName"
            label={t("user:first-name")}
            type="text"
            value={props.values.firstName}
            onChange={props.handleChange}
            error={props.touched.firstName && Boolean(props.errors.firstName)}
            helperText={props.touched.firstName && props.errors.firstName}
          />
          <TextField
            id="lastName"
            label={t("user:last-name")}
            type="text"
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
          <FormGroup>
            <FormControl required error={Boolean(props.errors.acceptAVG)}>
              <FormControlLabel control={<Checkbox id="acceptAVG" checked={props.values.acceptAVG} onChange={props.handleChange}/>} label={t("form:avg")}/>
                <FormHelperText>{props.errors.acceptAVG}</FormHelperText>
            </FormControl>

            {tikkie && (
              <>
                <FormControl required error={Boolean(props.errors.tikkie)}>
                  <Button sx={{ mr: 'auto', my: 2, backgroundColor: '#413f80'}} variant="contained" onClick={() => window.open(tikkie, '_blank')?.focus()}>{t("message:pay-tikkie")}</Button>
                  <FormControlLabel control={<Checkbox id="tikkie" checked={props.values.tikkie} onChange={(_event,checked) => props.setFieldValue("tikkie", checked)}/>}
                                    label={t("message:tikkie")}/>
                    <FormHelperText>{props.errors.tikkie}</FormHelperText>
                </FormControl>

              </>
            )}
          </FormGroup>
          <Box>
            <LoadingButton type="submit" loading={props.isSubmitting}>
              <span>{t("common:submit")}</span>
            </LoadingButton>
          </Box>
        </Stack>
      </form>
    )}
  </Formik>
}
