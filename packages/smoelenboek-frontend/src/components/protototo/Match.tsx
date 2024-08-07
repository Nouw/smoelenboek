import React from "react";
import { ProtototoPredictions, ProtototoPredictionsExternal } from "smoelenboek-types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import { Formik, FormikProps } from "formik";
import moment from "moment";
import { LoadingButton } from "@mui/lab";
import { usePostProtototoBetMutation, usePostProtototoResultMutation } from "../../api/endpoints/protototo";
import { SnackbarContext } from "../../providers/SnackbarContext";
import { Severity } from "../../providers/SnackbarProvider";
import { useTranslation } from "react-i18next";

interface MatchProps {
  home: string;
  away: string;
  date: Date;
  matchId: number;
  gender: string;
  previousBet?: ProtototoPredictions | ProtototoPredictionsExternal,
  firstName?: string;
  lastName?: string;
  email?: string;
  result?: boolean;
}

interface FormValues {
  setOne: boolean;
  setTwo: boolean;
  setThree: boolean;
  setFour?: boolean;
  setFive?: boolean;
}

export const Match: React.FC<MatchProps> = ({ home, away, date, matchId, gender, previousBet, firstName, lastName, email, result }) => {
  const initialValues: FormValues = {
    setOne: previousBet?.setOne ?? true,
    setTwo: previousBet?.setTwo ?? true,
    setThree: previousBet?.setThree ?? true,
    setFour: previousBet?.setFour ?? true,
    setFive: previousBet?.setFive ?? true
  }

  const snackbar = React.useContext(SnackbarContext);
  const { t } = useTranslation(["protototo", "messages", "error"]);

  const formRef = React.createRef<FormikProps<FormValues>>();

  const [trigger] = usePostProtototoBetMutation();
  const [resultTrigger] = usePostProtototoResultMutation();

  const [formValues, setFormValues] = React.useState<FormValues>(initialValues);
  const [setFourVisible, setSetFourVisible] = React.useState<boolean>(false);
  const [setFiveVisible, setSetFiveVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!formValues) return;
    setSetFourVisible(true);
    let setFour: boolean = true;
   

    if (
      [formValues.setOne, formValues.setTwo, formValues.setThree, formValues.setFour].filter(Boolean).length === 2
      && setFour
    ) {
      setSetFiveVisible(true);
    } else {
      setSetFiveVisible(false);
    }
  }, [formValues, gender])

  React.useEffect(() => {
    if (!formRef.current) return;

    if (!setFourVisible) {
      formRef.current.setFieldValue("setFour", true);
    }

    if (!setFiveVisible) {
      formRef.current.setFieldValue("setFive", true);
    }
  }, [setFourVisible, setFiveVisible, formRef])

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    try {
      if (result) {
        await resultTrigger({ id: matchId, ...values });
      } else {
        await trigger({ id: matchId, ...values, firstName, lastName, email });
      }

      snackbar.openSnackbar(t("messages:protototo.submit-message"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }

    values.setSubmitting(false);
  }

  return <Card>
    <CardHeader title={`${home} vs ${away}`} />
    <CardContent>
      <Formik<FormValues> innerRef={formRef} initialValues={initialValues} onSubmit={(values, { setSubmitting }) => {
        submit({ ...values, setSubmitting })
      }}
      >
        {(props: FormikProps<FormValues>) => {
          setFormValues(props.values)
          return <form onSubmit={props.handleSubmit} noValidate>
            <List>
              <ListItem>
                <ListItemText>{t("protototo:set.one")}</ListItemText>
                <Stack direction="row" gap={4}>
                  <Button variant={props.values.setOne ? "contained" : "outlined"} onClick={() => props.setFieldValue("setOne", true, true)}>{t("protototo:win")}</Button>
                  <Button variant={!props.values.setOne ? "contained" : "outlined"} onClick={() => props.setFieldValue("setOne", false, true)}>{t("protototo:lose")}</Button>
                </Stack>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText>{t("protototo:set.two")}</ListItemText>
                <Stack direction="row" gap={4}>
                  <Button variant={props.values.setTwo ? "contained" : "outlined"} onClick={() => props.setFieldValue("setTwo", true, true)}>{t("protototo:win")}</Button>
                  <Button variant={!props.values.setTwo ? "contained" : "outlined"} onClick={() => props.setFieldValue("setTwo", false, true)}>{t("protototo:lose")}</Button>
                </Stack>
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemText>{t("protototo:set.three")}</ListItemText>
                <Stack direction="row" gap={4}>
                  <Button variant={props.values.setThree ? "contained" : "outlined"} onClick={() => props.setFieldValue("setThree", true, true)}>{t("protototo:win")}</Button>
                  <Button variant={!props.values.setThree ? "contained" : "outlined"} onClick={() => props.setFieldValue("setThree", false, true)}>{t("protototo:lose")}</Button>
                </Stack>
              </ListItem>
              {setFourVisible && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText>{t("protototo:set.four")}</ListItemText>
                    <Stack direction="row" gap={4}>
                      <Button variant={props.values.setFour ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFour", true, true)}>{t("protototo:win")}</Button>
                      <Button variant={!props.values.setFour ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFour", false, true)}>{t("protototo:lose")}</Button>
                    </Stack>
                  </ListItem>
                </>
              )}
              {setFiveVisible && (
                <>
                  <Divider />
                  <ListItem>
                    <ListItemText>{t("protototo:set.five")}</ListItemText>
                    <Stack direction="row" gap={4}>
                      <Button variant={props.values.setFive ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFive", true, true)}>{t("protototo:win")}</Button>
                      <Button variant={!props.values.setFive ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFive", false, true)}>{t("protototo:lose")}</Button>
                    </Stack>
                  </ListItem>
                </>
              )}
            </List>
            <Stack direction="row">
              <Typography variant="caption" sx={{ marginLeft: 2 }}>
                {moment(date).fromNow(true)}
              </Typography>
              <LoadingButton type="submit" loading={props.isSubmitting} sx={{ marginLeft: "auto" }}>{t("common:submit")}</LoadingButton>
            </Stack>
          </form>
        }}
      </Formik>
    </CardContent>
  </Card>
}
