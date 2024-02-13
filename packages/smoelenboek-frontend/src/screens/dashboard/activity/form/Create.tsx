import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader, Paper,
  Stack,
  TextField,
} from "@mui/material";
import {StyledTextInput} from "../../../../components/form/StyledTextInput";
import {Add} from "@mui/icons-material";
import {useTranslation} from "react-i18next";
import {
  FormFieldBuilder,
  SelectType,
  selectTypes
} from "../../../../components/form/activity/builder/FormFieldBuilder.tsx";
import {FieldArray, Formik} from "formik";
import {array, boolean, InferType, mixed, object, string} from "yup";
import {LoadingButton} from "@mui/lab";

interface CreateProps {
}

const schema = object({
  title: string().default(""),
  description: string().default(""),
  questions: array().of(
    object().shape({
      title: string().required(),
      description: string(),
      required: boolean().default(() => false),
      paragraph: boolean(),
      type: mixed<SelectType>().oneOf(selectTypes.map((x) => x.value)),
    })
  ).default([])
})

export const Create: React.FC<CreateProps> = () => {
  const {t} = useTranslation(["common", "form"]);

  type FormValues = InferType<typeof schema>;

  return (
    <Formik<FormValues> initialValues={{title: "", description: "", questions: []}}
                        onSubmit={(values) => console.log(values)}>
      {props => (
        <form onSubmit={props.handleSubmit} noValidate>
        <Box>
          <Stack spacing={2}>
            <Paper elevation={2}>
              <LoadingButton type="submit" loading={props.isSubmitting}>
                <span>{t("common:save")}</span>
              </LoadingButton>
            </Paper>
              <Card>
                <CardHeader title={t("form:create-form")}/>
                <CardContent>
                  <Stack spacing={1}>
                    <TextField value={props.values.title} label={t("form:title")} fullWidth
                               onChange={(e) => props.setFieldValue('title', e.target.value)}/>
                    <StyledTextInput value={props.values.description ?? ""} height={200} toolbar
                                     onChange={(value) => props.setFieldValue("description", value)}/>
                  </Stack>
                </CardContent>
              </Card>
              <FieldArray name="questions" render={(arrayProps) => (
                <>
                  {props.values.questions.map((_question, index) => (
                    <FormFieldBuilder key={index} name={`questions.${index}`}/>
                  ))}
                  <Card>
                    <CardContent>
                      <Box flex={1} textAlign="center">
                        <Button
                          startIcon={<Add/>}
                          onClick={() => arrayProps.push({type: "text"})}
                        >
                          {t("form:question.add-question")}
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </>
              )}/>
          </Stack>
        </Box>
        </form>
      )}

    </Formik>
  );
};
