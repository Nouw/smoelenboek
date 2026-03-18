import React from "react";
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { DateTimePicker } from "@mui/x-date-pickers";
import { FieldArray, Formik, FormikProps } from "formik";
import { useTranslation } from "react-i18next";
import { PollFormValues, schema } from "./schema";

interface PollFormProps {
  initialValues: PollFormValues;
  submit: (
    values: PollFormValues & {
      setSubmitting: (submitting: boolean) => void;
    },
  ) => void;
}

export const PollForm: React.FC<PollFormProps> = ({ initialValues, submit }) => {
  const { t } = useTranslation(["common", "navigation", "season", "form"]);

  return (
    <Card>
      <CardContent>
        <Formik<PollFormValues>
          validationSchema={schema}
          initialValues={initialValues}
          onSubmit={(values, { setSubmitting }) => submit({ ...values, setSubmitting })}
        >
          {(props: FormikProps<PollFormValues>) => (
            <form onSubmit={props.handleSubmit} noValidate>
              <Typography variant="h5">{t("navigation:dashboard.add-poll")}</Typography>
              <br />
              <Stack spacing={2}>
                <TextField
                  id="question"
                  name="question"
                  label={t("common:question")}
                  value={props.values.question}
                  onChange={props.handleChange}
                  error={props.touched.question && Boolean(props.errors.question)}
                  helperText={props.touched.question && props.errors.question}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={props.values.allowMultiple}
                      onChange={(_event, checked) =>
                        props.setFieldValue("allowMultiple", checked)
                      }
                    />
                  }
                  label={t("common:multiple-choice")}
                />

                <DateTimePicker
                  label={t("season:start-date")}
                  format="hh:mm dd-MM-yyyy"
                  value={props.values.voteStartAt}
                  onChange={(value) => props.setFieldValue("voteStartAt", value)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: props.touched.voteStartAt && Boolean(props.errors.voteStartAt),
                      helperText:
                        props.touched.voteStartAt && props.errors.voteStartAt
                          ? t(`form:${props.errors.voteStartAt}`)
                          : "",
                    },
                  }}
                />

                <DateTimePicker
                  label={t("season:end-date")}
                  format="hh:mm dd-MM-yyyy"
                  value={props.values.voteEndAt}
                  onChange={(value) => props.setFieldValue("voteEndAt", value)}
                  slotProps={{
                    textField: {
                      variant: "outlined",
                      error: props.touched.voteEndAt && Boolean(props.errors.voteEndAt),
                      helperText:
                        props.touched.voteEndAt && props.errors.voteEndAt
                          ? t(`form:${props.errors.voteEndAt}`)
                          : "",
                    },
                  }}
                />

                <FieldArray
                  name="options"
                  render={(arrayHelpers) => (
                    <Stack spacing={2}>
                      {props.values.options.map((option, index) => (
                        <Stack key={`option-${index}`} direction="row" spacing={1}>
                          <TextField
                            fullWidth
                            name={`options.${index}`}
                            label={`${t("common:option")} ${index + 1}`}
                            value={option}
                            onChange={props.handleChange}
                            error={Boolean((props.errors.options as string[] | undefined)?.[index])}
                            helperText={(props.errors.options as string[] | undefined)?.[index] ?? ""}
                          />
                          <IconButton
                            type="button"
                            aria-label="remove-option"
                            disabled={props.values.options.length <= 2}
                            onClick={() => arrayHelpers.remove(index)}
                          >
                            <Remove />
                          </IconButton>
                        </Stack>
                      ))}

                      <Box>
                        <LoadingButton
                          type="button"
                          onClick={() => arrayHelpers.push("")}
                          startIcon={<Add />}
                        >
                          {t("common:add-option")}
                        </LoadingButton>
                      </Box>
                    </Stack>
                  )}
                />

                <Box>
                  <LoadingButton type="submit" loading={props.isSubmitting} variant="contained">
                    <span>{t("common:save")}</span>
                  </LoadingButton>
                </Box>
              </Stack>
            </form>
          )}
        </Formik>
      </CardContent>
    </Card>
  );
};
