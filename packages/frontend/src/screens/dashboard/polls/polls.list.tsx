import React from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Delete, Insights } from "@mui/icons-material";
import {
  useLoaderData,
  useNavigate,
  useNavigation,
  useRevalidator,
} from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../components/loading";
import {
  PropollResponse,
  useDeletePollMutation,
} from "../../../api/endpoints/propoll.api";
import { Options } from "../../../components/dashboard/options";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";

export const PollsList: React.FC = () => {
  const { t } = useTranslation(["common", "navigation", "options", "messages", "error"]);
  const { success, error } = React.useContext(SnackbarContext);
  const navigate = useNavigate();
  const isLoading = useNavigation().state === "loading";
  const revalidator = useRevalidator();
  const polls = useLoaderData() as PropollResponse[];
  const [deletePoll] = useDeletePollMutation();

  const [selected, setSelected] = React.useState<number>(-1);
  const [visible, setVisible] = React.useState(false);

  async function removePoll() {
    if (selected < 0) {
      return;
    }

    try {
      await deletePoll(polls[selected].id).unwrap();
      success(t("messages:poll.delete"));
      setSelected(-1);
      setVisible(false);
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t("common:question")}</TableCell>
            <TableCell>{t("common:type")}</TableCell>
            <TableCell>{t("common:options")}</TableCell>
            <TableCell>{t("common:total-votes")}</TableCell>
            <TableCell align="right">{t("common:options")}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {polls.map((poll, index) => (
            <TableRow key={poll.id}>
              <TableCell>{poll.question}</TableCell>
              <TableCell>
                {poll.allowMultiple
                  ? t("common:multiple-choice")
                  : t("common:single-choice")}
              </TableCell>
              <TableCell>{poll.options.length}</TableCell>
              <TableCell>{poll.totalVotes}</TableCell>
              <TableCell align="right">
                <Options>
                  <MenuItem onClick={() => navigate(`/dashboard/polls/info/${poll.id}`)}>
                    <ListItemIcon>
                      <Insights fontSize="small" />
                    </ListItemIcon>
                    {t("options:insights")}
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setSelected(index);
                      setVisible(true);
                    }}
                  >
                    <ListItemIcon>
                      <Delete fontSize="small" />
                    </ListItemIcon>
                    {t("options:remove")}
                  </MenuItem>
                </Options>
              </TableCell>
            </TableRow>
          ))}
          {polls.length === 0 && (
            <TableRow>
              <TableCell colSpan={5}>{t("navigation:dashboard.no-polls")}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("common:remove")}</DialogTitle>
        <DialogContent>
          {selected >= 0 && polls[selected] !== undefined && (
            <DialogContentText>
              {t("common:confirmation")} {polls[selected].question}?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={removePoll}>
            {t("common:remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
