import React from "react";
import {useGetActivityQuery, useLazyGetFormQuery, usePostRegistrationMutation} from "../../api/endpoints/activity.ts";
import {useParams} from "react-router-dom";
import {Loading} from "../../components/Loading.tsx";
import {Box, Card, CardContent, Divider, Paper, Stack, Typography} from "@mui/material";
import {Info} from "../../components/activity/Info.tsx";
import ReactHtmlParser from "react-html-parser";
import {FormTextField} from "../../components/form/activity/input/FormTextField.tsx";
import {FormChoiceField} from "../../components/form/activity/input/FormChoiceField.tsx";
import {FormSelectField} from "../../components/form/activity/input/FormSelectField.tsx";
import {Formik, FormikProps} from "formik";
import {FormQuestion} from "smoelenboek-types";
import {LoadingButton} from "@mui/lab";
import {useIsAnonymous} from "../../hooks/useIsAnonymous.ts";
import {ContactInfo} from "../../components/activity/ContactInfo.tsx";

interface SignUpProps {

}

type FormValues = {
  [key: string]: string | string[];
}

export const SignUp: React.FC<SignUpProps> = () => {
  const params = useParams();
  const isAnonymous = useIsAnonymous();

  const {data, isLoading} = useGetActivityQuery(parseInt(params.id ?? ""));
  const [trigger, {data: formResponse}] = useLazyGetFormQuery();
  const [triggerRegistration] = usePostRegistrationMutation();

  React.useEffect(() => {
    if (data?.data.form.id) {
      trigger(data.data.form.id);
    }
  }, [data])

  if (isLoading || !data) {
    return <Loading/>
  }

  const activity = data.data;
  const form = formResponse?.data;

  async function submit(values: FormValues, setSubmitting: (value: boolean) => void) {
    try {
      await triggerRegistration({id: params.id as string, data: values});
      setSubmitting(false);
    } catch (e) {
      console.error(e);
    }
  }


  return (
    <Formik<FormValues> initialValues={{}} onSubmit={(values, {setSubmitting}) => submit(values, setSubmitting)}>
      {(props: FormikProps<NonNullable<unknown>>) => (
        <form noValidate onSubmit={props.handleSubmit}>
          <Stack spacing={3}>
            <Info activity={activity}/>
            {form && (
              <Card>
                <CardContent>
                  <Typography variant="h4">{form.title}</Typography>
                  <Typography variant="body1">{ReactHtmlParser(form.description ?? "")}</Typography>
                  <Divider sx={{m: 2}}/>
                  <Stack spacing={2}>
                    {isAnonymous && activity.public && <ContactInfo />}

                    {form.questions.map((question: FormQuestion) => {
                      if (question.type === "text") {
                        return <FormTextField question={question}/>
                      }

                      if (question.type === "choice") {
                        return <FormChoiceField question={question}/>
                      }

                      if (question.type === "select") {
                        return <FormSelectField question={question}/>
                      }

                      return
                    })}
                  </Stack>
                </CardContent>
              </Card>
            )}
            <Paper elevation={2}>
              <Box p={2}>
                <LoadingButton variant="contained" type="submit"
                               loading={props.isSubmitting}>Inschrijven</LoadingButton>
              </Box>
            </Paper>
          </Stack>


        </form>
      )}
    </Formik>
  )
}
