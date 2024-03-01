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
import { array, boolean, mixed, object, string } from "yup";

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

export const formQuestionSchema = array().of(
  object().shape({
    title: string().required("field-required"),
    description: string(),
    required: boolean().default(() => false),
    paragraph: boolean(),
    type: mixed<SelectType>().oneOf(selectTypes.map((x) => x.value)),
    items: array<Item>().nullable(),
  }),
);

export const FormFieldBuilder: React.FC<FormFieldBuilderProps> = ({ name }) => {
  const { t } = useTranslation(["form"]);

  const [titleFieldProps, titleFieldMeta] = useField(`${name}.title`);
  const [typeFieldProps] = useField(`${name}.type`);
  const [requiredFieldProps, , requiredHelpers] = useField(`${name}.required`);
  const [paragraphFieldProps, , paragraphHelpers] = useField(
    `${name}.paragraph`,
  );
  const [, , itemsHelpers] = useField(`${name}.items`);

  const [options, setOptions] = React.useState<Item[]>([]);

  React.useEffect(() => {
    itemsHelpers.setValue(options);
  }, [options]);

  return (
    <Card>
      <CardContent>
        <Stack direction="row" gap={2} useFlexGap flexWrap="wrap">
          <TextField
            {...titleFieldProps}
            label={t("form:question.question")}
            error={Boolean(titleFieldMeta.error)}
            helperText={t(titleFieldMeta.error)}
            sx={{ flex: 0.7 }}
          />
          <FormControl sx={{ flex: 0.3 }}>
            <InputLabel id="question-type">
              {t("form:question.type")}
            </InputLabel>
            <Select<SelectType>
              {...typeFieldProps}
              labelId="question-type"
              label="Type"
            >
              <MenuItem value="text">
                {t("form:question.text")}
              </MenuItem>
              <MenuItem value="choice">
                {t("form:question.choice")}
              </MenuItem>
              <MenuItem value="select">
                {t("form:question.select")}
              </MenuItem>
              <MenuItem value="dropdown">
                Dropdown
              </MenuItem>
            </Select>
          </FormControl>
        </Stack>
        <Box py={2}>
          {typeFieldProps.value === "text" && <FormTextField disabled />}
          {typeFieldProps.value === "select" && (
            <FormOptionFieldBuilder
              baseOptions={options}
              onChange={(values) => setOptions(values)}
              type="select"
            />
          )}
          {typeFieldProps.value === "choice" && (
            <FormOptionFieldBuilder
              baseOptions={options}
              onChange={(values) => setOptions(values)}
              type="choice"
            />
          )}
          {typeFieldProps.value === "dropdown" && (
            <FormOptionFieldBuilder
              baseOptions={options}
              onChange={(values) => setOptions(values)}
              type="dropdown"
            />
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Stack direction="row" gap={2} sx={{ ml: "auto" }}>
          <FormGroup>
            <Stack direction="row">
              {typeFieldProps.value === "text" && (
                <FormControlLabel
                  control={
                    <Switch
                      value={paragraphFieldProps.value}
                      onChange={(_event, checked) =>
                        paragraphHelpers.setValue(checked)}
                    />
                  }
                  label={t("form:question.paragraph")}
                  color="primary"
                  labelPlacement="start"
                />
              )}
              <FormControlLabel
                control={
                  <Switch
                    value={requiredFieldProps.value}
                    onChange={(_event, checked) =>
                      requiredHelpers.setValue(checked)}
                  />
                }
                label={t("form:question.required")}
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
