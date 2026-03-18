import React from "react";
import {
  Box,
  Card,
  CardContent,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import { LoadingButton } from "@mui/lab";
import { DateTimePicker } from "@mui/x-date-pickers";
import { useLoaderData } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PropollResponse,
  useUpdatePollMutation,
} from "../../../api/endpoints/propoll.api";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";

interface EditableOption {
  id?: number;
  text: string;
}

export const PollInfo: React.FC = () => {
  const { t } = useTranslation([
    "common",
    "messages",
    "error",
    "navigation",
    "season",
  ]);
  const { success, error } = React.useContext(SnackbarContext);
  const [updatePoll, { isLoading }] = useUpdatePollMutation();

  const initialPoll = useLoaderData() as PropollResponse;
  const [poll, setPoll] = React.useState(initialPoll);
  const [editing, setEditing] = React.useState(false);

  const [question, setQuestion] = React.useState(initialPoll.question);
  const [allowMultiple, setAllowMultiple] = React.useState(initialPoll.allowMultiple);
  const [voteStartAt, setVoteStartAt] = React.useState<Date | null>(
    initialPoll.voteStartAt ? new Date(initialPoll.voteStartAt) : null,
  );
  const [voteEndAt, setVoteEndAt] = React.useState<Date | null>(
    initialPoll.voteEndAt ? new Date(initialPoll.voteEndAt) : null,
  );
  const [options, setOptions] = React.useState<EditableOption[]>(
    initialPoll.options.map((option) => ({ id: option.id, text: option.text })),
  );

  function beginEdit() {
    setQuestion(poll.question);
    setAllowMultiple(poll.allowMultiple);
    setVoteStartAt(poll.voteStartAt ? new Date(poll.voteStartAt) : null);
    setVoteEndAt(poll.voteEndAt ? new Date(poll.voteEndAt) : null);
    setOptions(poll.options.map((option) => ({ id: option.id, text: option.text })));
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  function addOption() {
    setOptions((current) => [...current, { text: "" }]);
  }

  function removeOption(index: number) {
    if (options.length <= 2) {
      return;
    }

    setOptions((current) => current.filter((_, currentIndex) => currentIndex !== index));
  }

  function updateOption(index: number, value: string) {
    setOptions((current) =>
      current.map((option, currentIndex) =>
        currentIndex === index ? { ...option, text: value } : option,
      ),
    );
  }

  async function save() {
    const trimmedQuestion = question.trim();
    const normalizedOptions = options
      .map((option) => ({ ...option, text: option.text.trim() }))
      .filter((option) => option.text.length > 0);

    const uniqueOptionTexts = new Set(normalizedOptions.map((option) => option.text));

    if (!trimmedQuestion || normalizedOptions.length < 2 || uniqueOptionTexts.size < 2) {
      error(t("error:error-message"));
      return;
    }

    if (!voteStartAt || !voteEndAt || voteEndAt < voteStartAt) {
      error(t("messages:poll.invalid-date-range"));
      return;
    }

    try {
      const updated = await updatePoll({
        id: poll.id,
        body: {
          question: trimmedQuestion,
          allowMultiple,
          voteStartAt,
          voteEndAt,
          options: normalizedOptions,
        },
      }).unwrap();

      setPoll(updated);
      setEditing(false);
      success(t("messages:poll.update"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          {!editing ? (
            <Stack spacing={2}>
              <Typography variant="h5">{poll.question}</Typography>
              <Typography>
                {t("common:type")}: {" "}
                {poll.allowMultiple
                  ? t("common:multiple-choice")
                  : t("common:single-choice")}
              </Typography>
              <Typography>
                {t("common:total-votes")}: {poll.totalVotes}
              </Typography>
              <Typography>
                {t("season:start-date")}: {poll.voteStartAt ? new Date(poll.voteStartAt).toLocaleString() : "-"}
              </Typography>
              <Typography>
                {t("season:end-date")}: {poll.voteEndAt ? new Date(poll.voteEndAt).toLocaleString() : "-"}
              </Typography>
              <Box>
                <LoadingButton variant="contained" onClick={beginEdit}>
                  {t("common:edit")}
                </LoadingButton>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <Typography variant="h5">{t("navigation:dashboard.edit-poll")}</Typography>
              <TextField
                label={t("common:question")}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={allowMultiple}
                    onChange={(_event, checked) => setAllowMultiple(checked)}
                  />
                }
                label={t("common:multiple-choice")}
              />

              <DateTimePicker
                label={t("season:start-date")}
                format="hh:mm dd-MM-yyyy"
                value={voteStartAt}
                onChange={(value) => setVoteStartAt(value)}
              />
              <DateTimePicker
                label={t("season:end-date")}
                format="hh:mm dd-MM-yyyy"
                value={voteEndAt}
                onChange={(value) => setVoteEndAt(value)}
              />

              {options.map((option, index) => (
                <Stack key={`poll-option-${option.id ?? index}`} direction="row" spacing={1}>
                  <TextField
                    fullWidth
                    label={`${t("common:option")} ${index + 1}`}
                    value={option.text}
                    onChange={(event) => updateOption(index, event.target.value)}
                  />
                  <IconButton
                    type="button"
                    onClick={() => removeOption(index)}
                    disabled={options.length <= 2}
                  >
                    <Remove />
                  </IconButton>
                </Stack>
              ))}

              <Box>
                <LoadingButton type="button" onClick={addOption} startIcon={<Add />}>
                  {t("common:add-option")}
                </LoadingButton>
              </Box>

              <Stack direction="row" spacing={1}>
                <LoadingButton variant="contained" loading={isLoading} onClick={save}>
                  {t("common:save")}
                </LoadingButton>
                <LoadingButton onClick={cancelEdit}>{t("common:cancel")}</LoadingButton>
              </Stack>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">{t("common:insights")}</Typography>
            {poll.options.map((option) => {
              const percentage =
                poll.totalVotes > 0 ? (option.votes / poll.totalVotes) * 100 : 0;

              return (
                <Box key={`insight-${option.id}`}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography>{option.text}</Typography>
                    <Typography>
                      {option.votes} {t("common:votes")} ({percentage.toFixed(0)}%)
                    </Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={percentage} />
                </Box>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
};
