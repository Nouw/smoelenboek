import React from "react";
import {FormQuestion} from "smoelenboek-types";
import {FormControl, FormControlLabel, FormLabel, Radio, RadioGroup} from "@mui/material";
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

  const [props, , helpers] = useField({ name: question.id, validate });

  return (
    <FormControl>
      <FormLabel>{ question.title }</FormLabel>
      <RadioGroup value={props.value} onChange={(e) => helpers.setValue(e.target.value)}>
        {question.items.map((item) => (
          <FormControlLabel value={item.label} control={<Radio />} label={item.label} />
        ))}
      </RadioGroup>
    </FormControl>
  )
}
