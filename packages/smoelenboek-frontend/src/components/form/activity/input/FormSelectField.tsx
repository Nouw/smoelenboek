import React from "react";
import {FormQuestion} from "smoelenboek-types";
import {Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, Stack, Typography} from "@mui/material";
import {useField} from "formik";

interface FormSelectFieldProps {
  question: FormQuestion;
}

export const FormSelectField: React.FC<FormSelectFieldProps> = ({ question }) => {
  function validate(value: any) {
    if (!value && question.required) {
      return 'This field is required!';
    }
  }

  const [field, , helpers] = useField({ name: question.id, validate, value: [] })

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.value?.includes(e.target.name)) {
      const temp = field.value;
      temp.splice(e.target.name, 1);
      helpers.setValue(temp);
    } else {
      if (field.value) {
        helpers.setValue([...field.value, e.target.name]);
      } else {
        helpers.setValue([e.target.name]);
      }
    }
  }

  return (
    <Stack>
      <FormControl>
        <FormLabel>{question.title}</FormLabel>
        <FormGroup>
          {question.items.map((item) => (
            <FormControlLabel control={<Checkbox value={field.value?.includes(item.label)} name={item.label} onChange={(e) => onChange(e)}/>} label={item.label}/>
          ))}
        </FormGroup>
      </FormControl>

    </Stack>
  )
}
