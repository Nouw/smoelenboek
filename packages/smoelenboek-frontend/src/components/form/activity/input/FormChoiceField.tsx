import React from "react";
import {FormQuestion} from "smoelenboek-types";
import {FormControl, FormControlLabel, FormHelperText, FormLabel, Radio, RadioGroup} from "@mui/material";
import {useField} from "formik";

interface FormChoiceFieldProps {
  question: FormQuestion;
}

export const FormChoiceField: React.FC<FormChoiceFieldProps> = ({ question }) => {
  function validate(value: any) {
    let msg;

    if (!value && question.required) {
      return 'This field is required!';
    }

    return msg;
  }

  const [props, meta, helpers] = useField({ name: question.id, validate });

  return (
    <FormControl required={question.required} error={Boolean(meta.error)}>
      <FormLabel component="legend">{ question.title }</FormLabel>
      <RadioGroup value={props.value} onChange={(e) => helpers.setValue(e.target.value)}>
        {question.items.map((item) => (
          <FormControlLabel value={item.label} control={<Radio />} label={item.label}/>
        ))}
      </RadioGroup>
      <FormHelperText error>{meta.error}</FormHelperText>
    </FormControl>
  )
}
