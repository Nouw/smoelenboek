import React from "react";
import { SeasonForm, SeasonFormValues } from "../../../forms/season/season.form";
import { Loading } from "../../../components/loading";
import { schema } from "../../../forms/season/schema";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUpdateSeasonMutation } from "../../../api/endpoints/seasons.api";
import { parse } from "date-fns";

export const SeasonsInfo: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error"]);
  const season = useLoaderData() as { id: number, startDate: string, endDate: string };

  const [putSeason] = useUpdateSeasonMutation();

  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      await putSeason({ id: season.id, endDate: values.endDate, startDate: values.startDate }).unwrap();

      success(t("messages:season.update"))
      values.setSubmitting(false);
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
      values.setSubmitting(false);
    }

    return
  }

  if (!season) {
    return <Loading />
  }

  return <SeasonForm<SeasonFormValues> schema={schema} submit={submit} initialValues={{ 
    startDate: parse(season.startDate, "yyyy-MM-dd", new Date()), endDate: parse(season.endDate, "yyyy-MM-dd", new Date()) }} />
}
