import React from "react";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { FormValues, TeamsForm } from "../../../forms/teams/teams.form";
import { useCreateTeamMutation } from "../../../api/endpoints/teams.api";
import { CreateTeamDto } from "backend";

export const TeamsAdd: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error"]);

  const [createTeam] = useCreateTeamMutation();

  async function submit({ values, setSubmitting } : { values: FormValues, setSubmitting: (value: boolean) => void }) {
    try {
      await createTeam(values as unknown as CreateTeamDto).unwrap();

      success(t("messages:teams.create"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    setSubmitting(false);
    return
  }

  return <TeamsForm submit={submit} />
} 
