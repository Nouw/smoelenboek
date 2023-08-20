import React, {ChangeEvent} from "react";
import {TextField} from "@mui/material";
import {useTranslation} from "react-i18next";

interface TextQuestionProps {
  paragraph: boolean,
  builder?: boolean,
  onChange?: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

export const TextQuestion: React.FC<TextQuestionProps> = (props) => {
  const { t } = useTranslation();

  return <TextField
    fullWidth
    placeholder={t("dashboard.form.question.answer")}
    multiline={props.paragraph}
    rows={props.paragraph ? 4 : 1}
    onChange={props.onChange}
    disabled={props.builder}
  />

}
