import React from "react";
import {
  Card,
  CardContent,
  TextField,
  Typography,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem, FormHelperText, Box
} from "@mui/material";
import {Field, Formik, FormikProps} from "formik";
import {LoadingButton} from "@mui/lab";
import {useTranslation} from "react-i18next";

interface CategoryFormProps {
  initialValues: FormValues;
  submit: (values: FormValues & { setSubmitting:(submitting: boolean) => void }) => void;
  title: string;
}

export interface FormValues {
  name: string;
  type: "photos" | "documents",
}

// const schema = Yup.object({
//   name: Yup.string().required(),
//   type: Yup.string().required(),
// })
//

export const CategoryForm: React.FC<CategoryFormProps> = ({ initialValues, title, submit }) => {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent>
        <Formik<FormValues> initialValues={initialValues} onSubmit={(values, { setSubmitting }) => {
          submit({...values, setSubmitting});
        }}>
          {(props: FormikProps<FormValues>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography>{title}</Typography>
              <br/>
              <Stack spacing={2}>
                <TextField
                  id="name"
                  label={t("dashboard.documents.name")}
                  value={props.values.name}
                  onChange={props.handleChange}
                  error={props.touched.name && Boolean(props.errors.name)}
                  helperText={props.touched.name && props.errors.name}
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
                        value={props.values.type}
                        onChange={(value) => props.setFieldValue("type", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="photos">Photos</MenuItem>
                        <MenuItem value="documents">Documents</MenuItem>
                      </Select>
                      {touched.gender && Boolean(errors.type) &&
                          <FormHelperText>{errors.type}</FormHelperText>
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
