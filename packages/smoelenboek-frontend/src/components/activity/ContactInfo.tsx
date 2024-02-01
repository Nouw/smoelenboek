import React from "react";
import {Divider, Stack, TextField, Typography} from "@mui/material";
import {useField} from "formik";

interface ContactInfoProps {

}

export const ContactInfo: React.FC<ContactInfoProps> = () => {
  function validate(value: any) {
    let msg;

    if (!value) {
      return 'This field is required!';
    }

    return msg;
  }

  const [emailProps, emailMeta , emailHelpers] = useField({ name: "email", validate });
  const [firstNameProps, firstNameMeta, firstNameHelpers] = useField({ name: "firstName", validate });
  const [lastNameProps, lastNameMeta, lastNameHelpers] = useField({ name: "lastName", validate });

  return (
    <Stack spacing={2}>
      <Typography variant="h5">Gegevens</Typography>
      <TextField label="Email" value={emailProps.value} error={Boolean(emailMeta.error)} helperText={emailMeta.touched && emailMeta.error} required onChange={(e) =>  emailHelpers.setValue(e.target.value)}/>
      <Stack direction="row" flex={1} spacing={2}>
        <TextField label="Firstname" fullWidth value={firstNameProps.value} error={Boolean(firstNameMeta.error)} helperText={firstNameMeta.touched && firstNameMeta.error} required onChange={(e) =>  firstNameHelpers.setValue(e.target.value)} />
        <TextField label="Lastname"  fullWidth value={lastNameProps.value} error={Boolean(lastNameMeta.error)} helperText={lastNameMeta.touched && lastNameMeta.error} required onChange={(e) =>  lastNameHelpers.setValue(e.target.value)} />
      </Stack>
      <Divider />
    </Stack>
  )
}
