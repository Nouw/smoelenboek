import React from "react";
import { FormQuestion } from "smoelenboek-types";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  FormLabel,
  Stack,
} from "@mui/material";
import { useField } from "formik";

interface FormSelectFieldProps {
  question: FormQuestion;
}

export const FormSelectField: React.FC<FormSelectFieldProps> = (
  { question },
) => {
  function validate(value: any) {
    if (!value && question.required) {
      return "This field is required!";
    }

    return;
  }

  const [field, meta, helpers] = useField({
    name: question.id,
    validate,
    value: [],
  });
  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (field.value?.includes(e.target.name)) {
      helpers.setValue([...field.value].filter(v => v !== e.target.name));
    } else {
      if (field.value) {
        helpers.setValue([...field.value, e.target.name]);
      } else {
        helpers.setValue([e.target.name]);
      }
    }
  };

  return (
    <Stack>
      <FormControl required={question.required} error={Boolean(meta.error)}>
        <FormLabel>{question.title}</FormLabel>
        <FormGroup>
          {question.items.map((item) => {
						return (
              <FormControlLabel
                control={
                  <Checkbox
                    checked={field.value?.includes(item.label)|| ''}
                    name={item.label}
                    onChange={(e) => onChange(e)}
                  />
                }
                label={item.label}
              />
            );
          })}
        </FormGroup>
        <FormHelperText error>{meta.error}</FormHelperText>
      </FormControl>
    </Stack>
  );
};
