import { Alert, Button, Card, CardContent, CardHeader, Checkbox, FormControl, FormControlLabel, FormGroup, FormHelperText, Stack, TextField } from "@mui/material";
import { ProtototoMatch, ProtototoSeason } from "backend";
import React from "react";
import { useLoaderData } from "react-router-dom";
import { useLazyGetNevoboMatchQuery } from "../../api/endpoints/nevobo.api";
import { isBefore } from "date-fns";
import { Bet } from "../../components/protototo/bet";
import isAuthenticated from "../../hooks/auth/is-authenticated.hook";
import { Formik } from "formik";
import { schema } from "../../forms/protototo/schema.external";
import * as Yup from "yup";
import { useTranslation } from "react-i18next";

export type ProtototoMatchExtended = { date: Date } & ProtototoMatch;

export type FormValues = Yup.InferType<typeof schema>;

export const ProtototoBetList: React.FC = () => {
  const season = useLoaderData() as ProtototoSeason;
  const authenticated = isAuthenticated();
  const { t } = useTranslation();

  const [getTeam] = useLazyGetNevoboMatchQuery();

  const [matches, setMatches] = React.useState<ProtototoMatchExtended[]>([]);

  React.useEffect(() => {
    if (!season) {
      return;
    }

    const filterMatches = async () => {
      const filtered = [];

      for (const match of season.matches) {
        const nevoboMatch = await getTeam(`${match.nevoboId}`).unwrap();

        if (!nevoboMatch || isBefore(new Date(nevoboMatch.tijdstip), new Date())) {
          continue;
        }

        filtered.push({ ...match, date: new Date(nevoboMatch.tijdstip) });
      }

      setMatches(filtered);
    }

    filterMatches();
  }, [season, getTeam])

  if (!season) {
    return <Alert severity="info">
      Er zijn momenteel geen wedstrijden waarop je kan overspellen.
    </Alert>
  }

  return (
    <Stack direction="column" gap={3}>
      {!authenticated ? (
        <Formik<FormValues> initialValues={{ email: '', firstName: '', lastName: '' }} onSubmit={() => console.log('hello')} validationSchema={schema}>
          {(props) => (
            <>
              <Card>
                <CardHeader title="Gegevens" />
                <CardContent>
                  <Stack gap={2}>
                    <TextField
                      id="email"
                      label={t("user:email")}
                      value={props.values.email}
                      onChange={props.handleChange}
                      error={Boolean(props.errors.email)}
                      helperText={props.touched.email && Boolean(props.errors.email) && t(`form:${props.errors.email}`)}
                    />
                    <Stack direction="row" gap={2}>
                      <TextField
                        id="firstName"
                        label={t("user:first-name")}
                        value={props.values.firstName}
                        onChange={props.handleChange}
                        error={Boolean(props.errors.firstName)}
                        helperText={props.touched.firstName && Boolean(props.errors.firstName) && t(`form:${props.errors.firstName}`)}
                        fullWidth
                      />
                      <TextField
                        id="lastName"
                        label={t("user:last-name")}
                        value={props.values.lastName}
                        onChange={props.handleChange}
                        error={Boolean(props.errors.lastName)}
                        helperText={props.touched.lastName && Boolean(props.errors.lastName) && t(`form:${props.errors.lastName}`)}
                        fullWidth
                      />
                    </Stack>
                    {season.tikkie &&
                      <>
                        <FormControl required error={props.touched.tikkie && Boolean(props.errors.tikkie)}>
                          <FormGroup>
                            <Button
                              sx={{ mr: 'auto', my: 2, backgroundColor: '#413f80' }}
                              variant="contained"
                              onClick={() => window.open(season.tikkie, '_blank')?.focus()}>
                              Tikkie
                            </Button>
                            <FormControlLabel control={<Checkbox />} checked={props.values.tikkie} onChange={(_, checked) => props.setFieldValue('tikkie', checked)} label={t('protototo:tikkie')} />

                          </FormGroup>
                          {props.errors.tikkie &&
                            <FormHelperText error>{props.errors.tikkie === "tikkie is a required field" ? t('form:field-required') : t(`form:${props.errors.tikkie}`)}</FormHelperText>

                          }
                        </FormControl>
                      </>
                    }
                  </Stack>
                </CardContent>
              </Card>
              {matches.map((match) => <Bet match={match} previous={match.predictions[0]} externalInfo={props.values} validateParent={props.validateForm} />)}
            </>
          )}
        </Formik>
      ) : (
        <>
          {matches.map((match) => <Bet match={match} previous={match.predictions[0]} />)}
        </>
      )}
    </Stack>
  );
}
