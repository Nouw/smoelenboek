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
import { Delete, Edit, Sync } from "@mui/icons-material";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import { Team } from "backend";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { Loading } from "../../../components/loading";
import { Options } from "../../../components/dashboard/options";
import { useDeleteTeamMutation } from "../../../api/endpoints/teams.api";

export const TeamsList: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = React.useContext(SnackbarContext);
  const navigation = useNavigation();
  const { t } = useTranslation(["common", "team", "messages", "options", "error"]);

  const [deleteTeamApi] = useDeleteTeamMutation();
  //const [syncPhotosApi, { isLoading: syncPhotosIsLoading }] =
  //  useJobSyncTeamPhotosMutation();
  const teams = useLoaderData() as Team[];

  // const [teams, setTeams] = React.useState<Team[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  if (navigation.state === "loading") {
    return <Loading />;
  }

  async function remove() {
    const team = teams[selected];

    try {
      await deleteTeamApi(team.id);

      setSelected(-1);
      setVisible(false);

      success(t("messages:teams.delete"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function syncPhotos() {
    //try {
    //  await syncPhotosApi();
    //
    //  snackbar.openSnackbar(t("messages:teams.sync-photo"), Severity.SUCCESS);
    //} catch (e) {
    //  console.error(e);
    //  snackbar.openSnackbar(t("error:error-message", Severity.ERROR));
    //}
  }

  return (
    <>
      <LoadingButton
        variant="contained"
        onClick={() => syncPhotos()}
        sx={{ mb: 2 }}
        startIcon={<Sync />}
        loading={false}
      >
        {t("team:sync-photos")}
      </LoadingButton>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("common:name")}
              </TableCell>
              <TableCell align="right">
                {t("options:options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {teams.map((team, key) => (
              <TableRow>
                <TableCell>
                  {team.name}
                </TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${team.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      {t("options:edit")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setSelected(key);
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
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("team:delete-team")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>
              {t("common:confirmation")} {teams[selected].name}?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={() => remove()}>
            {t("remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
