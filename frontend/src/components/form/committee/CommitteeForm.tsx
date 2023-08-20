import React from "react";
import * as Yup from 'yup';
import {Box, Card, CardContent, Stack, TextField, Typography} from "@mui/material";
import {Formik} from "formik";
import {LoadingButton} from "@mui/lab";
import {useParams} from "react-router-dom";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {useCreateCommitteeMutation, useUpdateCommitteeMutation} from "../../../api/endpoints/committees";
import {addCommittees, updateCommittees} from "../../../store/feature/committees.slice";
import {useAppDispatch} from "../../../store/hooks";
import {useTranslation} from "react-i18next";

interface CommitteeFormProps {
  method: 'put' | 'post';
  message: string;
  name?: string;
  email?: string;
}

interface FormValues {
  name: string;
  email: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars,@typescript-eslint/ban-ts-comment
// @ts-ignore
const schema = Yup.object({
  name: Yup.string().required(),
  email: Yup.string().email()
})

export const CommitteeForm: React.FC<CommitteeFormProps> = ({ method, message, name, email }) => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [createCommittee] = useCreateCommitteeMutation();
  const [updateCommittee] = useUpdateCommitteeMutation();

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      if (method === 'put') {
        const res = await updateCommittee({ id: parseInt(params.id as string), name: values.name, email: values.email}).unwrap();

        dispatch(updateCommittees([res.data]))
      } else {
        const res = await createCommittee({ name: values.name, email: values.email}).unwrap();

        dispatch(addCommittees([res.data]));
      }

      snackbar.openSnackbar(message, Severity.SUCCESS);
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={{ name: name ?? "", email: email ?? ""}}
          onSubmit={(values, { setSubmitting }) => {
            submit({...values, setSubmitting})
          }}
        >
          {(props) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{method === 'put' ? t("dashboard.committee.updateCommittee") : t("dashboard.committee.createCommittee")}</Typography>
              <br/>
              <Stack spacing={2}>
                <TextField
                  id="name"
                  label={t("dashboard.committee.name")}
                  value={props.values.name}
                  onChange={props.handleChange}
                  error={props.touched.name && Boolean(props.errors.name)}
                  helperText={props.touched.name && props.errors.name}
                />
                <TextField
                  id="email"
                  label={t("email")}
                  value={props.values.email}
                  onChange={props.handleChange}
                  error={props.touched.email && Boolean(props.errors.email)}
                  helperText={props.touched.email && props.errors.email}
                />
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
