import React from "react";
import { SeasonForm, SeasonFormValues } from "../../../forms/season/season.form";
import { schema } from "../../../forms/season/schema";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { useCreateSeasonMutation } from "../../../api/endpoints/seasons.api";
import { constructNow } from "date-fns";


export const SeasonsAdd: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error"]);

  const [createSeason] = useCreateSeasonMutation();

  async function submit(values: { [p: string]: any; setSubmitting: (isSubmitting: boolean) => void }) {
    try {
      await createSeason({ endDate: values.endDate, startDate: values.startDate }).unwrap();

      success(t("messages:season.create"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
    return
  }

  return <SeasonForm<SeasonFormValues> schema={schema} submit={submit} initialValues={{ startDate: constructNow(new Date()), endDate: constructNow(new Date()) }} />
} 
