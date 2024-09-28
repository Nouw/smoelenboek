import { Button, Card, CardContent, CardHeader, Divider, List, ListItem, ListItemText, SnackbarContent, Stack, Typography } from "@mui/material";
import { ProtototoPrediction } from "backend";
import React from "react";
import * as Yup from "yup";
import { schema } from "../../forms/protototo/schema.bet";
import { Formik, FormikErrors, FormikProps } from "formik";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import { formatDistanceToNow } from "date-fns";
import { ProtototoMatchExtended } from "../../screens/protototo/protototo.list";
import { useSaveProtototoBetMutation } from "../../api/endpoints/protototo.api";
import { SnackbarContext } from "../../providers/snackbar/snackbar.context";
import { FormValues as ExternalFormValues } from "../../screens/protototo/protototo.list";

interface BetProps {
  match: ProtototoMatchExtended;
  previous?: ProtototoPrediction;
  externalInfo?: ExternalFormValues;
  validateParent?: (values?: any) => Promise<FormikErrors<ExternalFormValues>>
}

type FormValues = Yup.InferType<typeof schema>;

export const Bet: React.FC<BetProps> = ({ match, previous, externalInfo, validateParent }) => {
  const { t } = useTranslation();
  const { success, error } = React.useContext(SnackbarContext)

  const [trigger] = useSaveProtototoBetMutation();

  const formRef = React.createRef<FormikProps<FormValues>>();

  function setFourVisible(values: FormValues) {
    if (!["Eredivisie", "Top divisie", "Superdivisie"].includes(match.rank)) return true;

    return [values.setOne, values.setTwo, values.setThree, values.setFour].filter(Boolean).length === 2;
  }

  function setFiveVisible(values: FormValues) {
    return [values.setOne, values.setTwo, values.setThree, values.setFour].filter(Boolean).length === 2;
  }

  async function submit(values: FormValues & { setSubmitting: (submitting: boolean) => void }) {
    if (validateParent) {
      const valid = await validateParent();
      
      if (Object.keys(valid).length > 0) {
        return;
      }
    }
  
    try {
      await trigger({
        id: match.id,
        body: { ...externalInfo, setOne: values.setOne, setTwo: values.setTwo, setThree: values.setThree, setFour: values.setFour, setFive: values.setFive }
      }).unwrap();

      success(t('messages:protototo.submit-message'))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"))
    }
  }

  return (
    <Card>
      <CardHeader title={`${match.homeTeam} vs ${match.awayTeam}`} />
      <CardContent>
        <Formik<FormValues> innerRef={formRef} initialValues={schema.cast({
          setOne: previous?.setOne,
          setTwo: previous?.setTwo,
          setThree: previous?.setThree,
          setFour: previous?.setFour ?? (setFourVisible({} as FormValues)),
          setFive: previous?.setFive,
        })} onSubmit={(values, { setSubmitting }) => submit({ ...values, setSubmitting })}>
          {(props: FormikProps<FormValues>) =>
          (
            <form onSubmit={props.handleSubmit} noValidate>
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
                {setFourVisible(props.values) && (
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
                {setFiveVisible(props.values) && (
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
                  {formatDistanceToNow(match.date)}
                </Typography>
                <LoadingButton type="submit" loading={props.isSubmitting} sx={{ marginLeft: "auto" }}>{t("common:submit")}</LoadingButton>
              </Stack>
            </form>
          )
          }
        </Formik>
      </CardContent>
    </Card>
  );
}
