import React from "react";
import {Box, Button, Card, CardContent, Divider, Stack, TextField} from "@mui/material";
import {StyledTextInput} from "../../StyledTextInput.tsx";
import {FieldArray, useField} from "formik";
import {useTranslation} from "react-i18next";
import {FormFieldBuilder} from "./FormFieldBuilder.tsx";
import {Add} from "@mui/icons-material";

interface CreateActivityFormProps {
  name: string;
}

export const CreateActivityForm: React.FC<CreateActivityFormProps> = ({ name }) => {
  const { t } = useTranslation();

  const [titleFieldProps, , titleFieldHelpers] = useField(`${name}.title`);
  const [descriptionFieldProps, , descriptionFieldHelpers] = useField(`${name}.description`);
  const [questionsFieldProps,] = useField(`${name}.questions`);
   
  return (
    <>
      <Stack spacing={1}>
        <TextField value={titleFieldProps.value} label={t("dashboard.form.title")} fullWidth
                   onChange={(e) => titleFieldHelpers.setValue(e.target.value)}/>
        <StyledTextInput value={descriptionFieldProps.value ?? ""} height={200} toolbar
                         onChange={(value) => descriptionFieldHelpers.setValue(value)}/>
        <Divider />
        <FieldArray name={`${name}.questions`} render={(arrayProps) => (
          <>
            {questionsFieldProps.value.map((_question: never, index: number) => (
              <>
                <FormFieldBuilder key={index} name={`${name}.questions.${index}`}/>
                <Divider />
              </>
            ))}
            <Card>
              <CardContent>
                <Box flex={1} textAlign="center">
                  <Button
                    startIcon={<Add/>}
                    onClick={() => arrayProps.push({type: "text"})}
                  >
                    {t("dashboard.form.question.addQuestion")}
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </>
        )}/>
      </Stack>
    </>
  )
}
