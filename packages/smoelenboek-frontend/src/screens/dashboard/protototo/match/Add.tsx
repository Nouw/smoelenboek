import React from "react";
import {FormValues, MatchForm} from "../../../../components/form/protototo/MatchForm";
import moment from "moment";
import {Severity} from "../../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../../providers/SnackbarContext";
import {useParams} from "react-router-dom";
import {PostProtototoMatch, usePostProtototoMatchMutation} from "../../../../api/endpoints/protototo";
import {useTranslation} from "react-i18next";

interface AddProps {

}

export const Add: React.FC<AddProps> = () => {
  const snackbar = React.useContext(SnackbarContext);
  const params = useParams();
  const { t } = useTranslation(["error", "messages"]);

  const [trigger] = usePostProtototoMatchMutation();

  async function submit(values: FormValues & { setSubmitting:(submitting: boolean) => void }) {
    try {
      await trigger({...values, seasonId: parseInt(params.id ?? "0")} as unknown as PostProtototoMatch).unwrap();

      snackbar.openSnackbar(t("messages:protototo.match.create"), Severity.SUCCESS)
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }

    values.setSubmitting(false);
  }

  return <MatchForm initialValues={{playDate: moment(), homeTeam: "", awayTeam: "", gender: "female"}} submit={submit} />
}
