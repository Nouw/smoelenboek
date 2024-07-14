import React from "react";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { CreateTeamDto } from "backend";
import { useCreateCommitteeMutation } from "../../../api/endpoints/committees.api";
import { CommitteeForm } from "../../../forms/committees/committee.form";
import { FormValues } from "../../../forms/committees/schema";

export const CommitteesAdd: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error"]);

  const [createCommittee] = useCreateCommitteeMutation();

  async function submit({ values, setSubmitting } : { values: FormValues, setSubmitting: (value: boolean) => void }) {
    try {
      await createCommittee(values as unknown as CreateTeamDto).unwrap();

      success(t("messages:committees.create"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    setSubmitting(false);
    return
  }

  return <CommitteeForm submit={submit} />
} 
