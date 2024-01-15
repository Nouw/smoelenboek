import React from "react";
import {useGetActivityQuery, useLazyGetFormQuery} from "../../api/endpoints/activity.ts";
import {useParams} from "react-router-dom";
import {Loading} from "../../components/Loading.tsx";
import {Button, Card, CardContent, Divider, Paper, Stack, Typography} from "@mui/material";
import {Info} from "../../components/activity/Info.tsx";
import ReactHtmlParser from "react-html-parser";
import {FormTextField} from "../../components/form/activity/input/FormTextField.tsx";
import {FormChoiceField} from "../../components/form/activity/input/FormChoiceField.tsx";
import {FormSelectField} from "../../components/form/activity/input/FormSelectField.tsx";
import {Formik, FormikProps} from "formik";

interface SignUpProps {

}

export const SignUp: React.FC<SignUpProps> = () => {
  const params = useParams();

  const {data, isLoading} = useGetActivityQuery(parseInt(params.id ?? ""));
  const [trigger, {data: formResponse, isLoading: isFormLoading}] = useLazyGetFormQuery();

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

  return (
    <Stack spacing={3}>
      <Info activity={activity}/>
      {form && (
        <Card>
          <CardContent>
            <Typography variant="h4">{form.title}</Typography>
            <Typography variant="body1">{ReactHtmlParser(form.description ?? "")}</Typography>

            <Divider sx={{ m: 2 }} />

            <Formik initialValues={{}} onSubmit={(values) => console.log(values)}>
              {(props: FormikProps<NonNullable<unknown>>) => (
                <form noValidate onSubmit={props.handleSubmit}>
                  <Stack spacing={2}>

                    {form.questions.map((question) => {
                      if (question.type === "text") {
                        return <FormTextField question={question}/>
                      }

                      if (question.type === "choice") {
                        return <FormChoiceField question={question}/>
                      }

                      if (question.type === "select") {
                        return <FormSelectField question={question}/>
                      }

                      return null
                    })}

                    <Paper elevation={2}>
                      <Button type="submit">Inschrijven</Button>
                    </Paper>
                  </Stack>


                </form>
              )}
            </Formik>

          </CardContent>
        </Card>
      )}

    </Stack>
  )
}
