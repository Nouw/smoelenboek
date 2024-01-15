import React from "react";
import {
  Box,
  Card,
  CardActions,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useField } from "formik";
import { useTranslation } from "react-i18next";
import { createLabelValueArray } from "../../utilities/LabelValue.ts";
import { Delete } from "@mui/icons-material";
import { FormTextField } from "./Text/FormTextField.tsx";
import { FormOptionFieldBuilder } from "./FormOptionFieldBuilder.tsx";
import { Item } from "../../../list/DraggableList.tsx";
import {array, boolean, mixed, object, string} from "yup";

interface FormFieldBuilderProps {
  name: string;
}

export const selectTypes = createLabelValueArray(
  { label: "Text", value: "text" },
  { label: "Choice", value: "choice" },
  { label: "Select", value: "select" },
  { label: "Dropdown", value: "dropdown" },
);

export type SelectType = typeof selectTypes[number]["value"];

export const formQuestionSchema =  array().of(
  object().shape({
    title: string().required(),
    description: string(),
    required: boolean().default(() => false),
    paragraph: boolean(),
    type: mixed<SelectType>().oneOf(selectTypes.map((x) => x.value)),
    items: array<Item>().nullable(),
  }));

export const FormFieldBuilder: React.FC<FormFieldBuilderProps> = ({ name }) => {
  const { t } = useTranslation();

  const [titleFieldProps] = useField(`${name}.title`);
  const [typeFieldProps] = useField(`${name}.type`)
  const [requiredFieldProps, , requiredHelpers] = useField(`${name}.required`);
  const [paragraphFieldProps, , paragraphHelpers] = useField(`${name}.paragraph`);
  const [, ,itemsHelpers] = useField(`${name}.items`);

	const [options, setOptions] = React.useState<Item[]>([]);

  React.useEffect(() => {
    itemsHelpers.setValue(options);
  }, [options])

  return (
        <Card>
          <CardContent>
            <Stack direction="row" gap={2} useFlexGap flexWrap="wrap">
              <TextField
                {...titleFieldProps}
                label={t("dashboard.form.question.question")}
                sx={{ flex: 0.7 }}
              />
              <FormControl sx={{ flex: 0.3 }}>
                <InputLabel id="question-type">
                  {t("dashboard.form.question.type")}
                </InputLabel>
                <Select<SelectType>
                  {...typeFieldProps}
                  labelId="question-type"
                  label="Type"
                >
                  <MenuItem value="text">
                    {t("dashboard.form.question.text")}
                  </MenuItem>
                  <MenuItem value="choice">
                    {t("dashboard.form.question.choice")}
                  </MenuItem>
                  <MenuItem value="select">
                    {t("dashboard.form.question.select")}
                  </MenuItem>
                  <MenuItem value="dropdown">
                    Dropdown
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
            <Box py={2}>
              {typeFieldProps.value === "text" && (
                <FormTextField disabled />
              )}
              {typeFieldProps.value === "select" && <FormOptionFieldBuilder baseOptions={options} onChange={(values) => setOptions(values)} type="select" />}
							{typeFieldProps.value === "choice" && <FormOptionFieldBuilder baseOptions={options} onChange={(values) => setOptions(values)} type="choice" />}
              {typeFieldProps.value === "dropdown" && <FormOptionFieldBuilder baseOptions={options} onChange={(values) => setOptions(values)} type="dropdown" />}
            </Box>
          </CardContent>
          <CardActions>
            <Stack direction="row" gap={2} sx={{ ml: "auto" }}>
              <FormGroup>
                <Stack direction="row">
                  {typeFieldProps.value === "text" && (
                    <FormControlLabel
                      control={
                        <Switch value={paragraphFieldProps.value} onChange={(_event, checked) => paragraphHelpers.setValue(checked)}/>
                      }
                      label={t("dashboard.form.question.paragraph")}
                      color="primary"
                      labelPlacement="start"
                    />
                  )}
                  <FormControlLabel
                    control={
                      <Switch
                        value={requiredFieldProps.value} onChange={(_event, checked) => requiredHelpers.setValue(checked)}
                      />
                    }
                    label={t("dashboard.form.question.required")}
                    color="primary"
                    labelPlacement="start"
                  />
                </Stack>
              </FormGroup>
              <Divider orientation="vertical" flexItem />
              <IconButton color="primary">
                <Delete />
              </IconButton>
            </Stack>
          </CardActions>
        </Card>
  );
};
