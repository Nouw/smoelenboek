import React from "react";
import { Box, Stack, TextField } from "@mui/material";
import { Formik } from "formik";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import * as Yup from "yup";
import { schema, stripToSchema } from "./schema";
import { SnackbarContext } from "../../providers/snackbar/snackbar.context";
import { useLoaderData, useNavigation } from "react-router-dom";
import { Loading } from "../../components/loading";
import { useAppSelector } from "../../store/hooks";
import { useUpdateInfoMutation } from "../../api/endpoints/user.api";
import { UpdateUserDto, User } from "backend";

type FormValues = Yup.InferType<typeof schema>; 

export const PersonalInformationForm = () => {
  const { t } = useTranslation(["common", "user", "messages", "error"]);
  const { success, error } = React.useContext(SnackbarContext);
  const navigation = useNavigation();
  const id = useAppSelector(state => state.auth.id); 
  const data = useLoaderData() as User;

  const [trigger] = useUpdateInfoMutation();
  
  if (navigation.state === "loading") return <Loading /> 

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    if (!id) {
      return;
    }

    try {
      const body = { ...values, id } as unknown as UpdateUserDto & { id: number } 
      
      await trigger(body).unwrap();

      success(t("messages:information-updated"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
  }

  return (
    <Formik<FormValues>
      initialValues={stripToSchema(data) as FormValues}
      onSubmit={(values, { setSubmitting }) => {
        submit({ ...values, setSubmitting });
      }}>
      {props => (
        <form onSubmit={props.handleSubmit} noValidate>
          <Stack spacing={2}>
            <TextField
              id="email"
              label={t("user:email")}
              type="email"
              value={props.values.email}
              onChange={props.handleChange}
              error={props.touched.email && Boolean(props.errors.email)}
              helperText={props.touched.email && props.errors.email}
            />
            <TextField
              id="phoneNumber"
              label={t("user:phone-number")}
              value={props.values.phoneNumber}
              onChange={props.handleChange}
              error={props.touched.phoneNumber && Boolean(props.errors.phoneNumber)}
              helperText={props.touched.phoneNumber && props.errors.phoneNumber}
            />
            <TextField
              id="streetName"
              label={t("user:street-name")}
              value={props.values.streetName}
              onChange={props.handleChange}
              error={props.touched.streetName && Boolean(props.errors.streetName)}
              helperText={props.touched.streetName && props.errors.streetName}
            />
            <TextField
              id="houseNumber"
              label={t("user:house-number")}
              value={props.values.houseNumber}
              onChange={props.handleChange}
              error={props.touched.houseNumber && Boolean(props.errors.houseNumber)}
              helperText={props.touched.houseNumber && props.errors.houseNumber}
            />
            <TextField
              id="postcode"
              label={t("user:postcode")}
              value={props.values.postcode}
              onChange={props.handleChange}
              error={props.touched.postcode && Boolean(props.errors.postcode)}
              helperText={props.touched.postcode && props.errors.postcode}
            />
            <TextField
              id="city"
              label={t("user:city")}
              value={props.values.city}
              onChange={props.handleChange}
              error={props.touched.city && Boolean(props.errors.city)}
              helperText={props.touched.city && props.errors.city}
            />
            <TextField
              id="bankaccountNumber"
              label={t("user:IBAN")}
              value={props.values.bankaccountNumber}
              onChange={props.handleChange}
              error={props.touched.bankaccountNumber && Boolean(props.errors.bankaccountNumber)}
              helperText={props.touched.bankaccountNumber && props.errors.bankaccountNumber}
            />
            <TextField
              id="backNumber"
              label={t("user:back-number")}
              type="number"
              value={props.values.backNumber}
              onChange={props.handleChange}
              error={props.touched.backNumber && Boolean(props.errors.backNumber)}
              helperText={props.touched.backNumber && props.errors.backNumber}
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
  )
}
