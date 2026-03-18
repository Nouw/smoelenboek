import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useCreatePollMutation } from "../../../api/endpoints/propoll.api";
import { PollForm } from "../../../forms/polls/polls.form";
import { PollFormValues, schema } from "../../../forms/polls/schema";

export const PollsAdd: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["messages", "error"]);
  const [createPoll] = useCreatePollMutation();

  async function submit(
    values: PollFormValues & { setSubmitting: (isSubmitting: boolean) => void },
  ) {
    try {
      const options = values.options
        .map((option) => option.trim())
        .filter((option) => option.length > 0);

      await createPoll({
        question: values.question.trim(),
        allowMultiple: values.allowMultiple,
        voteStartAt: values.voteStartAt,
        voteEndAt: values.voteEndAt,
        options,
      }).unwrap();

      success(t("messages:poll.create"));
      navigate("/dashboard/polls/");
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    values.setSubmitting(false);
  }

  return (
    <PollForm
      initialValues={schema.cast({
        question: "",
        allowMultiple: false,
        voteStartAt: new Date(),
        voteEndAt: new Date(),
        options: ["", ""],
      })}
      submit={submit}
    />
  );
};
