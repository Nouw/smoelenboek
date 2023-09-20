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
  const { t } = useTranslation();

  const schema = Yup.object({
    email: Yup.string().required(t("protototo.form.required")).email('Please enter a valid email address'),
    acceptAVG: Yup.boolean().oneOf([true], t("protototo.form.required")),
    firstName: Yup.string().required(t("protototo.form.required")),
    lastName: Yup.string().required(t("protototo.form.required")),
    showTikkie: Yup.boolean(),
    tikkie: Yup.boolean().when("showTikkie", (showTikkie, schema) => {
      if (showTikkie) {
        return schema.required(t("protototo.form.required"))
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
          <Typography variant="h4" textAlign="center">Gegevens</Typography>
          <TextField
            id="firstName"
            label={t("dashboard.user.firstName")}
            type="text"
            value={props.values.firstName}
            onChange={props.handleChange}
            error={props.touched.firstName && Boolean(props.errors.firstName)}
            helperText={props.touched.firstName && props.errors.firstName}
          />
          <TextField
            id="lastName"
            label={t("dashboard.user.lastName")}
            type="text"
            value={props.values.lastName}
            onChange={props.handleChange}
            error={props.touched.lastName && Boolean(props.errors.lastName)}
            helperText={props.touched.lastName && props.errors.lastName}
          />
          <TextField
            id="email"
            label={t("email")}
            type="email"
            value={props.values.email}
            onChange={props.handleChange}
            error={props.touched.email && Boolean(props.errors.email)}
            helperText={props.touched.email && props.errors.email}
          />
          <FormGroup>
            <FormControl required error={Boolean(props.errors.acceptAVG)}>
              <FormControlLabel control={<Checkbox id="acceptAVG" checked={props.values.acceptAVG} onChange={props.handleChange}/>} label="Ik ga akkoord met de verwerking van mijn persoonsgegevens door USV Protos"/>
                <FormHelperText>{props.errors.acceptAVG}</FormHelperText>
            </FormControl>

            {tikkie && (
              <>
                <FormControl required error={Boolean(props.errors.tikkie)}>
                  <Button sx={{ mr: 'auto', my: 2, backgroundColor: '#413f80'}} variant="contained" onClick={() => window.open(tikkie, '_blank')?.focus()}>Tikkie betalen</Button>
                  <FormControlLabel control={<Checkbox id="tikkie" checked={props.values.tikkie} onChange={(_event,checked) => props.setFieldValue("tikkie", checked)}/>}
                                    label="Hierbij bevestig ik dat ik bovenstaande tikkie heb betaald en deelneem aan de ProtoToto"/>
                    <FormHelperText>{props.errors.tikkie}</FormHelperText>
                </FormControl>

              </>
            )}
          </FormGroup>
          <Box>
            <LoadingButton type="submit" loading={props.isSubmitting}>
              <span>{t("submit")}</span>
            </LoadingButton>
          </Box>
        </Stack>
      </form>
    )}
  </Formik>
}
