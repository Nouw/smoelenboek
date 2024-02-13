import React from "react";
import {useParams} from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {TeamForm} from "../../../components/form/team/TeamForm";
import {Add, Delete} from "@mui/icons-material";
import {SearchUser, User} from "../../../components/SearchUser";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {SelectRole} from "../../../components/form/team/SelectRole";
import {
  useAddPlayerToTeamMutation,
  useRemovePlayerFromTeamMutation,
  useTeamInfoMutation, useUpdatePlayerMutation
} from "../../../api/endpoints/team";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addPlayerToTeam, removePlayerFromTeam, setTeamInfo, updatePlayer as updatePlayerState} from "../../../store/feature/teams.slice";
import {TeamFunction} from "smoelenboek-types";
import {useTranslation} from "react-i18next";

interface EditProps {

}

export interface Member {
  id: number;
  function: TeamFunction;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  }
}

export const Edit: React.FC<EditProps> = () => {
  const params = useParams();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "error", "messages"]);

  const [getTeamInfo] = useTeamInfoMutation();
  const [addPlayerToTeamApi] = useAddPlayerToTeamMutation();
  const [removePlayerFromTeamApi] = useRemovePlayerFromTeamMutation();
  const [updatePlayerApi] = useUpdatePlayerMutation();

  const info = useAppSelector(state => state.teams.teamInfo?.teamInfo);
  const members = useAppSelector(state => state.teams.teamInfo?.players);

  // const [info, setInfo] = React.useState<Info>();
  // const [members, setMembers] = React.useState<Member[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getTeamInfo(parseInt(params.id as string)).unwrap();

        dispatch(setTeamInfo(res.data));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getTeamInfo, params.id])

  async function addUser(value: User) {
    if (members) {
      if (members.findIndex((x) => x.id === value.id) >= 0) {
        snackbar.openSnackbar(`${value.firstName} ${value.lastName} ${t("messages:teams.already-part")}`);
        return
      }
    }

    try {
      const res = await addPlayerToTeamApi({id: parseInt(params.id as string), userId: value.id}).unwrap();

      dispatch(addPlayerToTeam(res.data));
      snackbar.openSnackbar(`${t("messages:teams.added")} ${value.firstName} ${value.lastName} ${t("messages:teams.toTeam")}`, Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR)
    }
  }

  async function removePlayer(player: Member, index: number) {
    try {
      await removePlayerFromTeamApi(player.id);

      dispatch(removePlayerFromTeam(index));
      snackbar.openSnackbar(t("messages:teams.removePlayer"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

  async function updatePlayer(id: number, role: TeamFunction, index: number) {
    try {
      const res = await updatePlayerApi({ id, role}).unwrap();
      console.log(res);
      dispatch(updatePlayerState({data: res.data, key: index}));
      snackbar.openSnackbar(t("messages:teams.roleUpdate"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
  }

  if (!info || members === undefined) {
    return <CircularProgress/>
  }

  return (
    <>
      <Stack spacing={2}>
        <TeamForm method="put" message={t("messages:teams.update")} name={info.name} league={info.rank} gender={info.gender} />
        <Card>
          <CardContent>
            <Button variant="contained" onClick={() => setVisible(true)}>
              <Add/>
              {t("team:add-user")}
            </Button>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {t("team:name")}
                    </TableCell>
                    <TableCell>
                      {t("team:role")}
                    </TableCell>
                    <TableCell align="right">
                      {t("common:remove")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {members.map((player, index) => (
                    <TableRow key={player.user.id}>
                      <TableCell>{player.user.firstName} {player.user.lastName}</TableCell>
                      <TableCell>
                        <SelectRole id={player.id} role={player.function} onUpdate={(id, role) => updatePlayer(id, role, index)}/>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => removePlayer(player, index)}>
                          <Delete/>
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Stack>
      <Dialog open={visible} onClose={() => setVisible(false)} >
        <DialogTitle>{t("team:add-user")}</DialogTitle>
        <DialogContent style={{width: 400, height: 200}}>
          <SearchUser onSelect={addUser}/>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
