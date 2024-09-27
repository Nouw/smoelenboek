import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, MenuItem, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import React from "react";
import { useLoaderData, useNavigate, useParams, useRevalidator } from "react-router-dom";
import { Options } from "../../../components/dashboard/options";
import { Delete, SportsScore } from "@mui/icons-material";
import { useDeleteProtototoMatchMutation, useFetchProtototoMatchResultMutation } from "../../../api/endpoints/protototo.api";
import { Loading } from "../../../components/loading";
import { useTranslation } from "react-i18next";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { ProtototoMatch } from "backend";
import { isFetchBaseQueryError } from "../../../store/helpers";

export const MatchesList: React.FC = () => {
  const { t } = useTranslation(["protototo", "options", "messages"]);
  const navigate = useNavigate();
  const params = useParams();

  const { success, error, warn } = React.useContext(SnackbarContext);
  const matches = useLoaderData() as ProtototoMatch[];
  const revalidator = useRevalidator();

  const [trigger] = useDeleteProtototoMatchMutation();
  const [fetchResult] = useFetchProtototoMatchResultMutation();

  const [selected, setSelected] = React.useState(-1);
  const [visible, setVisible] = React.useState(false);

  async function removeMatch(id: number) {
    try {
      await trigger({ matchId: id, seasonId: +(params.id!) }).unwrap();

      success(t("messages:protototo.match.delete"))
      setVisible(false);
      revalidator.revalidate();
    } catch (e) {
      console.error(e);
      error(t("error:error-message"))
    }
  }

  async function getMatchResult(id: number) {
    try {
      await fetchResult(id).unwrap();
      success(t("messages:protototo.match.fetched-result"));
    } catch (e) {
      if (isFetchBaseQueryError(e)) {
        if (e.status === 404) {
          warn(t("messages:protototo.match.fetch-not-found"));
          return;
        }
      }

      error(t("error:error-message"));
    }
  }

  if (!matches) {
    return <Loading />
  }

  return (
    <>
      <Button variant="contained" onClick={() => navigate(`/dashboard/protototo/matches/${params.id}/add`)}>Add Match</Button>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("protototo:home")}
              </TableCell>
              <TableCell>
                {t("protototo:away")}
              </TableCell>
              <TableCell align="right">
                {t("options:options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((match, key) => (
              <TableRow key={match.nevoboId}>
                <TableCell>{match.homeTeam}</TableCell>
                <TableCell>{match.awayTeam}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => {
                      getMatchResult(match.id);
                    }}>
                      <ListItemIcon>
                        <SportsScore />
                      </ListItemIcon>
                      {t("protototo:fetch-result")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setSelected(key);
                      setVisible(true);
                    }}>
                      <ListItemIcon>
                        <Delete fontSize="small" />
                      </ListItemIcon>
                      {t("options:remove")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("protototo:delete-match")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && matches[selected] !== undefined && (
            <>
              <DialogContentText>{t("common:confirmation")} {matches[selected].homeTeam} vs {matches[selected].awayTeam}?</DialogContentText>
              <br />
              <DialogContentText fontWeight="bold">{t("protototo:predictions-alert")}!</DialogContentText>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button onClick={() => removeMatch(matches[selected].id)}>{t("common:submit")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
};
