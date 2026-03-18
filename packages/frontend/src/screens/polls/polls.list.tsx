import React from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useLoaderData, useNavigation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PropollResponse,
  useVotePollMutation,
} from "../../api/endpoints/propoll.api";
import { Loading } from "../../components/loading";
import { SnackbarContext } from "../../providers/snackbar/snackbar.context";
import { isFetchBaseQueryError } from "../../store/helpers";

function toSelectionMap(polls: PropollResponse[]) {
  return polls.reduce<Record<number, number[]>>((acc, poll) => {
    acc[poll.id] = poll.selectedOptionIds;
    return acc;
  }, {});
}

function byNewest(a: PropollResponse, b: PropollResponse) {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

export const PollsList: React.FC = () => {
  const { t } = useTranslation(["common", "messages", "error"]);
  const { success, error } = React.useContext(SnackbarContext);
  const [votePoll] = useVotePollMutation();

  const navigation = useNavigation();
  const loaderData = useLoaderData() as PropollResponse[];
  const loadedPolls = React.useMemo(
    () => [...loaderData].sort(byNewest),
    [loaderData],
  );

  const [polls, setPolls] = React.useState<PropollResponse[]>(loadedPolls);
  const [selectedByPoll, setSelectedByPoll] = React.useState<Record<number, number[]>>(
    toSelectionMap(loadedPolls),
  );
  const [submittingPollId, setSubmittingPollId] = React.useState<number | null>(null);

  React.useEffect(() => {
    setPolls(loadedPolls);
    setSelectedByPoll(toSelectionMap(loadedPolls));
  }, [loadedPolls]);

  function handleSingleChoice(pollId: number, optionId: number) {
    setSelectedByPoll((current) => ({
      ...current,
      [pollId]: [optionId],
    }));
  }

  function handleMultiChoice(pollId: number, optionId: number, checked: boolean) {
    setSelectedByPoll((current) => {
      const selected = current[pollId] ?? [];
      const next = checked
        ? [...new Set([...selected, optionId])]
        : selected.filter((id) => id !== optionId);

      return {
        ...current,
        [pollId]: next,
      };
    });
  }

  async function submitPollVote(pollId: number) {
    const optionIds = selectedByPoll[pollId] ?? [];
    if (optionIds.length === 0) {
      return;
    }

    try {
      setSubmittingPollId(pollId);
      const updated = await votePoll({
        id: pollId,
        body: { optionIds },
      }).unwrap();

      setPolls((current) =>
        [...current.map((poll) => (poll.id === pollId ? updated : poll))].sort(
          byNewest,
        ),
      );
      setSelectedByPoll((current) => ({
        ...current,
        [pollId]: updated.selectedOptionIds,
      }));

      success(t("messages:poll.vote"));
    } catch (e) {
      if (isFetchBaseQueryError(e) && e.status === 400) {
        error(t("error:error-message"));
        return;
      }

      error(t("error:error-message"));
    } finally {
      setSubmittingPollId(null);
    }
  }

  if (navigation.state === "loading") {
    return <Loading />;
  }

  if (polls.length === 0) {
    return <Alert severity="info">{t("common:no-active-polls")}</Alert>;
  }

  return (
    <Stack spacing={2}>
      {polls.map((poll) => {
        const selectedOptionIds = selectedByPoll[poll.id] ?? [];

        return (
          <Card key={poll.id}>
            <CardContent>
              <Stack spacing={2}>
                <Box>
                  <Typography variant="h6">{poll.question}</Typography>
                  <Typography color="text.secondary">
                    {poll.allowMultiple
                      ? t("common:multiple-choice")
                      : t("common:single-choice")}
                  </Typography>
                </Box>

                {poll.allowMultiple ? (
                  <Stack>
                    {poll.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        control={
                          <Checkbox
                            checked={selectedOptionIds.includes(option.id)}
                            onChange={(_event, checked) =>
                              handleMultiChoice(poll.id, option.id, checked)
                            }
                          />
                        }
                        label={option.text}
                      />
                    ))}
                  </Stack>
                ) : (
                  <RadioGroup
                    value={selectedOptionIds[0] ?? ""}
                    onChange={(event) => handleSingleChoice(poll.id, +event.target.value)}
                  >
                    {poll.options.map((option) => (
                      <FormControlLabel
                        key={option.id}
                        value={option.id}
                        control={<Radio />}
                        label={option.text}
                      />
                    ))}
                  </RadioGroup>
                )}

                <Box>
                  <LoadingButton
                    variant="contained"
                    loading={submittingPollId === poll.id}
                    disabled={selectedOptionIds.length === 0}
                    onClick={() => submitPollVote(poll.id)}
                  >
                    {t("common:vote")}
                  </LoadingButton>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
};
