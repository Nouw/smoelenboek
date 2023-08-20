import React from "react";
import {Box, CircularProgress, Stack, TextField} from "@mui/material";
import {Formik} from "formik";
import {useTranslation} from "react-i18next";
import {LoadingButton} from "@mui/lab";
import {PutUserRequest, useUpdateMemberMutation} from "../../../api/endpoints/members";
import {useAppSelector} from "../../../store/hooks";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {User} from "smoelenboek-types";

interface PersonalInformationFormProps {
  base?: FormValues
}

export interface FormValues {
  streetName: string;
  houseNumber: string;
  postcode: string;
  city: string;
  email: string;
  phoneNumber: string;
  bankaccountNumber: string;
  backNumber: number;
}

export const PersonalInformationForm: React.FC<PersonalInformationFormProps> = ({ base }) => {
  const initialValues: FormValues = base ?? {
    backNumber: 0,
    bankaccountNumber: "",
    city: "",
    email: "",
    houseNumber: "",
    phoneNumber: "",
    postcode: "",
    streetName: ""
  }

  const { t } = useTranslation();
  const snackbar = React.useContext(SnackbarContext);

  const id = useAppSelector(state => state.auth.id);

  const [trigger] = useUpdateMemberMutation();

  if (!id) return <CircularProgress/>

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    if (!id) {
      return;
    }

    try {
      await trigger({ user: {...values as unknown as User, id}} as unknown as PutUserRequest).unwrap();

      snackbar.openSnackbar(t("message.settings.informationUpdated"), Severity.SUCCESS)
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
    }

    values.setSubmitting(false);
  }

  return (
    <Formik<FormValues>
      initialValues={initialValues}
      onSubmit={(values, { setSubmitting }) => {
        submit({...values, setSubmitting});
      }}>
      {props => (
        <form onSubmit={props.handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="email"
              label={t("email")}
              type="email"
              value={props.values.email}
              onChange={props.handleChange}
              error={props.touched.email && Boolean(props.errors.email)}
              helperText={props.touched.email && props.errors.email}
            />
            <TextField
              id="phoneNumber"
              label={t("phoneNumber")}
              value={props.values.phoneNumber}
              onChange={props.handleChange}
              error={props.touched.phoneNumber && Boolean(props.errors.phoneNumber)}
              helperText={props.touched.phoneNumber && props.errors.phoneNumber}
            />
            <TextField
              id="streetName"
              label={t("dashboard.user.streetName")}
              value={props.values.streetName}
              onChange={props.handleChange}
              error={props.touched.streetName && Boolean(props.errors.streetName)}
              helperText={props.touched.streetName && props.errors.streetName}
            />
            <TextField
              id="houseNumber"
              label={t("dashboard.user.houseNumber")}
              value={props.values.houseNumber}
              onChange={props.handleChange}
              error={props.touched.houseNumber && Boolean(props.errors.houseNumber)}
              helperText={props.touched.houseNumber && props.errors.houseNumber}
            />
            <TextField
              id="postcode"
              label={t("dashboard.user.postcode")}
              value={props.values.postcode}
              onChange={props.handleChange}
              error={props.touched.postcode && Boolean(props.errors.postcode)}
              helperText={props.touched.postcode && props.errors.postcode}
            />
            <TextField
              id="city"
              label={t("dashboard.user.city")}
              value={props.values.city}
              onChange={props.handleChange}
              error={props.touched.city && Boolean(props.errors.city)}
              helperText={props.touched.city && props.errors.city}
            />
            <TextField
              id="bankaccountNumber"
              label={t("dashboard.user.IBAN")}
              value={props.values.bankaccountNumber}
              onChange={props.handleChange}
              error={props.touched.bankaccountNumber && Boolean(props.errors.bankaccountNumber)}
              helperText={props.touched.bankaccountNumber && props.errors.bankaccountNumber}
            />
            <TextField
              id="backNumer"
              label={t("backNumber")}
              type="number"
              value={props.values.backNumber}
              onChange={props.handleChange}
              error={props.touched.backNumber && Boolean(props.errors.backNumber)}
              helperText={props.touched.backNumber && props.errors.backNumber}
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
  )
}
