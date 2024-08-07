import { TextField, TextFieldProps } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";

type FormTextFieldProps = {
	paragraph?: boolean;
} & TextFieldProps

export const FormTextField: React.FC<FormTextFieldProps> = (props) => {
  const { t } = useTranslation(["form"]);

	return (
    <TextField {...props} fullWidth placeholder={t("question.answer")} multiline={props.paragraph} rows={props.paragraph ? 4 : 1} />
  );
};
