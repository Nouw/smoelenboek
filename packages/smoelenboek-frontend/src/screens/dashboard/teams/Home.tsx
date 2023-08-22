import React from "react";
import {
  Button,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {Options} from "../../../components/dashboard/Options";
import {Delete, Edit} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {useRemoveTeamMutation, useTeamsMutation} from "../../../api/endpoints/team";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addTeams, removeTeam, teamsSelector} from "../../../store/feature/teams.slice";
import {useTranslation} from "react-i18next";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [getTeams, { isLoading }] = useTeamsMutation();
  const [removeTeamApi] = useRemoveTeamMutation();
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
    }

    getData();
  }, [dispatch, getTeams])

  if (isLoading) {
    return <CircularProgress/>
  }

  async function remove() {
    const team = teams[selected];

    try {
      await removeTeamApi(team.id);

      dispatch(removeTeam(team.id));

      setSelected(-1);
      setVisible(false);

      snackbar.openSnackbar(t("message.teams.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR)
    }
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("dashboard.team.name")}
              </TableCell>
              <TableCell align="right">
                {t("dashboard.options.options")}
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
                        <Edit fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.edit")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setSelected(key);
                      setVisible(true);
                    }}>
                      <ListItemIcon>
                        <Delete fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.remove")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("dashboard.team.deleteTeam")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>{t("confirmation")} {teams[selected].name}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("cancel")}</Button>
          <Button variant="contained" onClick={() => remove()}>{t("remove")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
