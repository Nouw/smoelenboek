import React from "react";
import {Box, Button, Card, CardContent, CardHeader, Stack, TextField} from "@mui/material";
import {FormQuestion} from "smoelenboek-types/dist/FormItem";
import {StyledTextInput} from "../../../../components/form/StyledTextInput";
import {Add} from "@mui/icons-material";
import {Question} from "../../../../components/form/Question";
import {useTranslation} from "react-i18next";

interface CreateProps {

}

export const Create: React.FC<CreateProps> = () => {
  const { t } = useTranslation();

  const [questions, setQuestions] = React.useState<FormQuestion[]>([{title: "Hello wrodl", required: false, description: "", id: "1", question: {type: "text", paragraph: false}}]);

  return (
    <Box>
      <Stack spacing={2}>
        <Card>
          <CardHeader title={t("dashboard.form.createForm")}/>
          <CardContent>
            <Stack spacing={1}>
              <TextField label={t("dashboard.form.title")} fullWidth/>
              <StyledTextInput height={200}/>
            </Stack>
          </CardContent>
        </Card>
        {questions.map((question) => (
            <Question data={question} builder={true}/>
        ))}
        <Card>
          <CardContent>
            <Box flex={1} textAlign="center">
              <Button startIcon={<Add/>} onClick={() => setQuestions((prevState) => [...prevState, {title: "Hello wrodl", required: false, description: "", id: "1", question: {type: "text", paragraph: false}}])}>
                {t("dashboard.form.question.addQuestion")}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  )
}
