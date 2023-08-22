import React from "react";
import {FormQuestion} from "smoelenboek-types/dist/FormItem";
import {
  Box,
  Card, CardActions,
  CardContent, Divider,
  FormControl, FormControlLabel, FormGroup, IconButton,
  InputLabel,
  MenuItem,
  Select, SelectChangeEvent,
  Stack, Switch,
  TextField,
  Typography
} from "@mui/material";
import {Delete} from "@mui/icons-material";
import {TextQuestion} from "./TextQuestion";
import {useTranslation} from "react-i18next";

interface QuestionProps {
  data: FormQuestion
  builder: boolean
}

export const Question: React.FC<QuestionProps> = (props) => {
  const builder = props.builder;

  const { t } = useTranslation();

  const [required, setRequired] = React.useState<boolean>(props.data.required);
  const [title, setTitle] = React.useState<string>(props.data.title);
  const [question, setQuestion] = React.useState(props.data.question);

  React.useEffect(() => {
    console.log(question);
    }, [question])

  const updateQuestionType = (e: SelectChangeEvent) => {
    switch (e.target.value) {
      case "text":
        setQuestion({type: "text", paragraph: false})
        return
      case "choice":
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore it's bullshit lol
        setQuestion({id: 1, type: "choice", options: []})
        return
      case "select":
        setQuestion({id: 1, type: "select", options: []})
        return
    }
  }

  return (
    <Box>
      <Card>
        <CardContent>
          {builder ? (
            <Stack direction="row" gap={2} useFlexGap flexWrap="wrap">
              <TextField label={t("dashboard.form.question.question")} value={title} onChange={(e) => setTitle(e.target.value)} sx={{flex: 0.7}}/>
              <FormControl sx={{flex: 0.3}}>
                <InputLabel id="question-type">{t("dashboard.form.question.type")}</InputLabel>
                <Select labelId="question-type" label="Type" defaultValue={props.data.question.type} onChange={updateQuestionType}>
                  <MenuItem value="text">{t("dashboard.form.question.text")}</MenuItem>
                  <MenuItem value="choice">{t("dashboard.form.question.choice")}</MenuItem>
                  <MenuItem value="select">{t("dashboard.form.question.select")}</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          ) : (
            <Typography>{title}</Typography>
          )}
          {question.type === "text" &&
              <Box py={2}>
                <TextQuestion paragraph={question.paragraph} builder={builder}/>
              </Box>
          }
        </CardContent>
        <CardActions>
          {builder && (
            <Stack direction="row" gap={2} sx={{ml: "auto"}}>
              {question.type === "text" && (
                <>
                  <FormGroup>
                    <FormControlLabel
                      control={<Switch value={question.paragraph} onChange={(e) => setQuestion({...question, paragraph: e.target.checked})}/>}
                      label={t("dashboard.form.question.paragraph")}
                      color="primary"
                      labelPlacement="start"
                    />
                  </FormGroup>
                  <Divider orientation="vertical" flexItem/>
                </>
              )}
              <FormGroup>
                <FormControlLabel control={<Switch value={required}  onChange={(e) => setRequired(e.target.checked)} />} label={t("dashboard.form.question.required")} color="primary" labelPlacement="start"/>
              </FormGroup>
              <Divider orientation="vertical" flexItem/>
              <IconButton color="primary">
                <Delete/>
              </IconButton>
            </Stack>
          )}
        </CardActions>
      </Card>
    </Box>
  )
}
