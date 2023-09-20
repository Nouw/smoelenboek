import React from "react";
import {ProtototoPredictions, ProtototoPredictionsExternal} from "smoelenboek-types";
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
import {Formik, FormikProps} from "formik";
import moment from "moment";
import {LoadingButton} from "@mui/lab";
import {usePostProtototoBetMutation, usePostProtototoResultMutation} from "../../api/endpoints/protototo";
import {SnackbarContext} from "../../providers/SnackbarContext";
import {Severity} from "../../providers/SnackbarProvider";
import {useTranslation} from "react-i18next";

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
    setFour: gender === "women" ? previousBet?.setFour ?? undefined : undefined,
    setFive: previousBet?.setFive ?? undefined,
  }

  const snackbar = React.useContext(SnackbarContext);
  const { t } = useTranslation();

  const formRef = React.createRef<FormikProps<FormValues>>();

  const [trigger] = usePostProtototoBetMutation();
  const [resultTrigger] = usePostProtototoResultMutation();

  const [formValues, setFormValues] = React.useState<FormValues>();
  const [setFourVisible, setSetFourVisible] = React.useState<boolean>(false);
  const [setFiveVisible, setSetFiveVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (!formValues) return;

    if (gender === 'men') {
      if (
        (!formValues.setOne && formValues.setTwo  && formValues.setThree ) ||
        (formValues.setOne  && !formValues.setTwo && formValues.setThree) ||
        (formValues.setOne  && formValues.setTwo && !formValues.setThree) ||
        (formValues.setOne  && !formValues.setTwo && !formValues.setThree) ||
        (!formValues.setOne  && formValues.setTwo && !formValues.setThree) ||
        (!formValues.setOne  && !formValues.setTwo && formValues.setThree)
      ) {
        setSetFourVisible(true);
      } else {
        setSetFourVisible(false);
      }
    } else if (gender === 'women') {
      setSetFourVisible(true);
      if (
        (!formValues.setOne && !formValues.setTwo && formValues.setThree && formValues.setFour) ||
        (!formValues.setOne && formValues.setTwo && !formValues.setThree && formValues.setFour) ||
        (!formValues.setOne && formValues.setTwo && formValues.setThree && !formValues.setFour) ||
        (!formValues.setOne && formValues.setTwo && formValues.setThree && !formValues.setFour) ||
        (!formValues.setOne && formValues.setTwo && !formValues.setThree && formValues.setFour) ||
        (formValues.setOne && formValues.setTwo && !formValues.setThree && !formValues.setFour) ||
        (formValues.setOne && !formValues.setTwo && formValues.setThree && !formValues.setFour) ||
        (formValues.setOne && !formValues.setTwo && !formValues.setThree && formValues.setFour)
      ) {
        setSetFiveVisible(true);
      } else {
        setSetFiveVisible(false);
      }
    }
  }, [formValues, gender])

  React.useEffect(() => {
    if (!formRef.current) return;

    if (!setFourVisible) {
      formRef.current.setFieldValue("setFour", undefined);
    }

    if (!setFiveVisible) {
      formRef.current.setFieldValue("setFive", undefined);
    }
  }, [setFourVisible, setFiveVisible, formRef])

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void}) {
    try {
      if (result) {
        await resultTrigger({ id: matchId, ...values });
      } else {
        await trigger({id: matchId, ...values, firstName, lastName, email});
      }

      snackbar.openSnackbar(t("protototo.submitMessage"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
    }

    values.setSubmitting(false);
  }

  return <Card>
    <CardHeader title={`${home} vs ${away}`} />
    <CardContent>
      <Formik<FormValues> innerRef={formRef} initialValues={initialValues} onSubmit={(values, { setSubmitting }) => {
        submit({...values, setSubmitting})
      }}
      >
        {(props: FormikProps<FormValues>) => {
          setFormValues(props.values);
          return <form onSubmit={props.handleSubmit} noValidate>
            <List>
            <ListItem>
              <ListItemText>Set 1</ListItemText>
              <Stack direction="row" gap={4}>
                <Button variant={props.values.setOne ? "contained" : "outlined"} onClick={() => props.setFieldValue("setOne", true, true)}>{t("protototo.win")}</Button>
                <Button variant={!props.values.setOne ? "contained" : "outlined"} onClick={() => props.setFieldValue("setOne", false, true)}>{t("protototo.lose")}</Button>
              </Stack>
            </ListItem>
            <Divider/>
            <ListItem>
              <ListItemText>Set 2</ListItemText>
              <Stack direction="row" gap={4}>
                <Button variant={props.values.setTwo ? "contained" : "outlined"} onClick={() => props.setFieldValue("setTwo", true, true)}>{t("protototo.win")}</Button>
                <Button variant={!props.values.setTwo ? "contained" : "outlined"} onClick={() => props.setFieldValue("setTwo", false, true)}>{t("protototo.lose")}</Button>
              </Stack>
            </ListItem>
            <Divider/>
            <ListItem>
              <ListItemText>Set 3</ListItemText>
              <Stack direction="row" gap={4}>
                <Button variant={props.values.setThree ? "contained" : "outlined"} onClick={() => props.setFieldValue("setThree", true, true)}>{t("protototo.win")}</Button>
                <Button variant={!props.values.setThree ? "contained" : "outlined"} onClick={() => props.setFieldValue("setThree", false, true)}>{t("protototo.lose")}</Button>
              </Stack>
            </ListItem>
            {setFourVisible && (
             <>
               <Divider/>
               <ListItem>
                 <ListItemText>Set 4</ListItemText>
                 <Stack direction="row" gap={4}>
                   <Button variant={props.values.setFour ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFour", true, true)}>{t("protototo.win")}</Button>
                   <Button variant={!props.values.setFour ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFour", false, true)}>{t("protototo.lose")}</Button>
                 </Stack>
               </ListItem>
             </>
            )}
            {setFiveVisible && (
              <>
                <Divider/>
                <ListItem>
                  <ListItemText>Set 5</ListItemText>
                  <Stack direction="row" gap={4}>
                    <Button variant={props.values.setFive ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFive", true, true)}>{t("protototo.win")}</Button>
                    <Button variant={!props.values.setFive ? "contained" : "outlined"} onClick={() => props.setFieldValue("setFive", false, true)}>{t("protototo.lose")}</Button>
                  </Stack>
                </ListItem>
              </>
            )}
          </List>
            <Stack direction="row">
              <Typography variant="caption" sx={{marginLeft: 2}}>
                {moment(date).locale('nl').fromNow(true)}
              </Typography>
              <LoadingButton type="submit" loading={props.isSubmitting} sx={{ marginLeft: "auto" }}>{t("submit")}</LoadingButton>
            </Stack>
          </form>
        }}
      </Formik>
    </CardContent>
  </Card>
}
