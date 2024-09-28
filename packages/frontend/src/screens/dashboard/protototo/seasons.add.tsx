import React from "react";
import { SeasonForm } from "../../../forms/season/season.form.tsx";
import { schema } from "../../../forms/protototo/schema.ts";
import { constructNow } from "date-fns";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context.ts";
import { useTranslation } from "react-i18next";
import { TextField } from "@mui/material";
import * as Yup from "yup";
import { useCreateProtototoSeasonMutation } from "../../../api/endpoints/protototo.api.ts";

type FormValues = Yup.InferType<typeof schema>;

export const SeasonsAdd: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error", "protototo"]);

  const [createSeason] = useCreateProtototoSeasonMutation();

  async function submit(values: {
    [p: string]: any;
    setSubmitting: (isSubmitting: boolean) => void;
  }) {
    try {
      await createSeason({
        end: values.endDate,
        start: values.startDate,
        tikkie: values.tikkie,
      }).unwrap();

      success(t("messages:season.create"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
    return;
  }

  return (
    <SeasonForm<FormValues>
      schema={schema}
      time
      initialValues={{
        startDate: constructNow(new Date()),
        endDate: constructNow(new Date()),
      }}
      submit={submit}
      fields={(props) => (
        <TextField
          id="tikkie"
          label={t("protototo:tikkie")}
          value={props.values.tikkie}
          onChange={props.handleChange}
          error={props.touched.tikkie && Boolean(props.errors.tikkie)}
          helperText={props.touched.tikkie && props.errors.tikkie}
        />
      )}
    />
  );
};
