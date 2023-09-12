import React from "react";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {useParams} from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  FormControl, FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import {Field, Formik} from "formik";
import {LoadingButton} from "@mui/lab";
import {Severity} from "../../../providers/SnackbarProvider";
import {useCreateTeamMutation, useUpdateTeamMutation} from "../../../api/endpoints/team";
import {useAppDispatch} from "../../../store/hooks";
import {addTeams, updateTeams} from "../../../store/feature/teams.slice";
import {useTranslation} from "react-i18next";

interface TeamFormProps {
  method: 'put' | 'post';
  message: string;
  name?: string;
  league?: string;
  gender?: "male" | "female"
}

interface FormValues {
  name: string;
  league: string;
  gender: "male" | "female"
}

// const schema = Yup.object({
//   name: Yup.string().required(),
//   league: Yup.string().required(),
//   gender: Yup.string()
// })

export const TeamForm: React.FC<TeamFormProps> = ({ method, message, name, league, gender }) => {
  const snackbar = React.useContext(SnackbarContext);
  const params = useParams();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [updateTeamApi] = useUpdateTeamMutation();
  const [createTeamApi] = useCreateTeamMutation();

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      if (method === 'put') {
        const res = await updateTeamApi({ id: parseInt(params.id as string), name: values.name, rank: values.league, gender: values.gender}).unwrap();

        dispatch(updateTeams([res.data]));
      } else {
        const res = await createTeamApi({id: 0, name: values.name, rank: values.league, gender: values.gender}).unwrap();

        dispatch(addTeams([res.data]));
      }

      snackbar.openSnackbar(message, Severity.SUCCESS)
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar('Something went wrong :(', Severity.ERROR);
      values.setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardContent>
        <Formik<FormValues>
          initialValues={{ name: name ?? "", league: league ?? "Top divisie", gender: gender ?? "male"}}
          onSubmit={(values, { setSubmitting }) => {
            submit({...values, setSubmitting})
          }}>
          {(props) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h4">{method === 'put' ? 'Update' : 'Create'} team</Typography>
              <br/>
              <Stack spacing={2}>
                <TextField
                  id="name"
                  label={t("dashboard.team.name")}
                  value={props.values.name}
                  onChange={props.handleChange}
                  error={props.touched.name && Boolean(props.errors.name)}
                  helperText={props.touched.name && props.errors.name}
                />
                <Field name="league">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <FormControl fullWidth>
                      <InputLabel id="rank-picker">{t("dashboard.team.league")}</InputLabel>
                      <Select
                        labelId="rank-picker"
                        label="league"
                        value={props.values.league}
                        onChange={(value) => props.setFieldValue("league", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="Eredivisie">Eredivisie</MenuItem>
                        <MenuItem value="Topdivisie">Topdivisie</MenuItem>
                        <MenuItem value="Eerste divisie">Eerste divisie</MenuItem>
                        <MenuItem value="Tweede divisie">Tweede divisie</MenuItem>
                        <MenuItem value="Derde divisie">Derde divisie</MenuItem>
                        <MenuItem value="Promotieklasse">Promotieklasse</MenuItem>
                        <MenuItem value="1e Klasse">1e Klasse</MenuItem>
                        <MenuItem value="2e Klasse">2e Klasse</MenuItem>
                        <MenuItem value="3e Klasse">3e Klasse</MenuItem>
                        <MenuItem value="4e Klasse">4e Klasse</MenuItem>
                      </Select>
                      {touched.league && Boolean(errors.league) &&
                          <FormHelperText>{errors.league}</FormHelperText>
                      }
                    </FormControl>
                  )}
                </Field>
                <Field name="gender">
                  {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                  {/* @ts-ignore */}
                  {({form: { touched, errors }}) => (
                    <FormControl fullWidth>
                      <InputLabel id="gender-picker">Type</InputLabel>
                      <Select
                        labelId="gender-picker"
                        label="Type"
                        value={props.values.gender}
                        onChange={(value) => props.setFieldValue("gender", value.target.value)}
                        fullWidth
                      >
                        <MenuItem value="male">{t("navigation.teams.women")}</MenuItem>
                        <MenuItem value="female">{t("navigation.teams.men")}</MenuItem>

                      </Select>
                      {touched.gender && Boolean(errors.gender) &&
                          <FormHelperText>{errors.gender}</FormHelperText>
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
