import React from "react";
import {TextField} from "@mui/material";
import {FormQuestion} from "smoelenboek-types";
import {useField} from "formik";

interface FormTextFieldProps {
  question: FormQuestion
}



export const FormTextField: React.FC<FormTextFieldProps> = ({ question }) => {
  function validate(value: any) {
    let msg;

    if (!value && question.required) {
      return 'This field is required!';
    }

    return msg;
  }

  const [props, meta , helpers] = useField({ name: question.id, validate});

  return (
      <TextField value={props.value || ""} error={Boolean(meta.error)} helperText={meta.touched && meta.error} required={question.required} onChange={(e) =>  helpers.setValue(e.target.value)} fullWidth  multiline={question.paragraph} rows={question.paragraph ? 4 : 1} label={question.title} />
  )
}
