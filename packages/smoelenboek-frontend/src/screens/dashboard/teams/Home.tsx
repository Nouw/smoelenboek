import React from "react";
import {
  Button,
  CircularProgress,
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
import { Options } from "../../../components/dashboard/Options";
import { Delete, Edit, Sync } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { Severity } from "../../../providers/SnackbarProvider";
import { SnackbarContext } from "../../../providers/SnackbarContext";
import {
  useRemoveTeamMutation,
  useTeamsMutation,
} from "../../../api/endpoints/team";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addTeams,
  removeTeam,
  teamsSelector,
} from "../../../store/feature/teams.slice";
import { useTranslation } from "react-i18next";
import { useJobSyncTeamPhotosMutation } from "../../../api/endpoints/job";
import { LoadingButton } from "@mui/lab";

interface HomeProps {
}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "team", "messages", "options", "error"]);

  const [getTeams, { isLoading }] = useTeamsMutation();
  const [removeTeamApi] = useRemoveTeamMutation();
  const [syncPhotosApi, { isLoading: syncPhotosIsLoading }] =
    useJobSyncTeamPhotosMutation();

  const teams = useAppSelector(teamsSelector.selectAll);

  // const [teams, setTeams] = React.useState<Team[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getTeams({ type: "" }).unwrap();

        dispatch(addTeams(res.data));
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [dispatch, getTeams]);

  if (isLoading) {
    return <CircularProgress />;
  }

  async function remove() {
    const team = teams[selected];

    try {
      await removeTeamApi(team.id);

      dispatch(removeTeam(team.id));

      setSelected(-1);
      setVisible(false);

      snackbar.openSnackbar(t("messages:teams.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

  async function syncPhotos() {
    try {
        await syncPhotosApi();

        snackbar.openSnackbar(t("messages:teams.sync-photo"), Severity.SUCCESS);
    } catch (e) {
        console.error(e);
        snackbar.openSnackbar(t("error:error-message", Severity.ERROR));
    }
  }

  return (
    <>
      <LoadingButton
        variant="contained"
        onClick={() => syncPhotos()}
        sx={{ mb: 2 }}
        startIcon={<Sync />} 
        loading={syncPhotosIsLoading}
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
};
