import { ProtototoSeason } from "backend";
import React from "react";
import { useLoaderData } from "react-router-dom";
import { SeasonForm } from "../../../forms/season/season.form";
import { schema } from "../../../forms/protototo/schema";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { useUpdateProtototoSeasonMutation } from "../../../api/endpoints/protototo.api";
import * as Yup from "yup";
import { TextField } from "@mui/material";
import { toDate } from "date-fns";

type FormValues = Yup.InferType<typeof schema>;

export const SeasonEdit: React.FC = () => {
  const season = useLoaderData() as ProtototoSeason;
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error", "protototo"]);

  //const [createSeason] = useCreateProtototoSeasonMutation();
  const [updateSeason] = useUpdateProtototoSeasonMutation();

  async function submit(values: {
    [p: string]: any;
    setSubmitting: (isSubmitting: boolean) => void;
  }) {
    try {
      await updateSeason({
        id: season.id,
        body: {
          end: values.endDate,
          start: values.startDate,
          tikkie: values.tikkie,
        }
      }).unwrap();

      success(t("messages:season.update"));
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
        startDate: toDate(season.start),
        endDate: toDate(season.end),
        tikkie: season.tikkie,
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
}
