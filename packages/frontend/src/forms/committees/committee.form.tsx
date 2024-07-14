import { useTranslation } from "react-i18next";
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Formik } from "formik";
import { LoadingButton } from "@mui/lab";
import { FormValues, schema } from "./schema";

type CommitteeFormProps = {
  values?: FormValues,
  submit: ({ values, setSubmitting }: { values: FormValues, setSubmitting: (value: boolean) => void }) => void,
  header?: string,
}

export const CommitteeForm: React.FC<CommitteeFormProps> = ({ values, submit, header }) => {
  const { t } = useTranslation(["common", "error", "committee"]);
  const initialValues = values ?? schema.cast({});
 
  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={initialValues}
          validationSchema={schema}
          onSubmit={(values, { setSubmitting }) => {
            submit({ values, setSubmitting });
          }}
        >
          {(props) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">
                {header ?? t("committee:create-committee")}
              </Typography>
              <br />
              <Stack spacing={2}>
                <TextField
                  id="name"
                  label={t("committee:name")}
                  value={props.values.name}
                  onChange={props.handleChange}
                  error={props.touched.name && Boolean(props.errors.name)}
                  helperText={props.touched.name && props.errors.name}
                />
                <TextField
                  id="email"
                  label={t("common:email")}
                  value={props.values.email}
                  onChange={props.handleChange}
                  error={props.touched.email && Boolean(props.errors.email)}
                  helperText={props.touched.email && props.errors.email}
                />
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
  );
}
