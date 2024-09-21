import React from "react";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { Loading } from "../../../components/loading";
import { Button, Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { SearchUser } from "../../../components/users/search-user";
import { useLoaderData, useRevalidator } from "react-router-dom";
import { FormValues, TeamsForm } from "../../../forms/teams/teams.form";
import { useAddUserToTeamMutation, useRemoveUserToTeamMutation, useUpdateTeamMutation, useUpdateUserToTeamMutation } from "../../../api/endpoints/teams.api";
import { SelectRole } from "../../../components/teams/select-role";
import { Team, TeamFunction, UpdateTeamDto, User, UserTeamSeason } from "backend";


export const TeamsInfo: React.FC = () => {
  const { success, warn, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["common", "error", "messages"]);

  const team = useLoaderData() as Team;
  const revalidator = useRevalidator();

  const [addPlayerToTeamApi] = useAddUserToTeamMutation();
  const [removePlayerFromTeamApi] = useRemoveUserToTeamMutation();
  const [updatePlayerApi] = useUpdateUserToTeamMutation();
  const [updateTeamApi] = useUpdateTeamMutation(); 

  const [visible, setVisible] = React.useState<boolean>(false);

  async function updateTeam({ values, setSubmitting }: { values: FormValues, setSubmitting: (value: boolean) => void }) {
    try {
      await updateTeamApi({ id: team.id, body: values as unknown as UpdateTeamDto }).unwrap();

      success(t("messages:teams.update"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    setSubmitting(false);
    return
  }


  async function addUser(value: User) {
    if (team.userTeamSeason) {
      if (team.userTeamSeason.findIndex((x) => x.user.id === value.id) >= 0) {
        warn(`${value.firstName} ${value.lastName} ${t("messages:teams.already-part")}`);
        return
      }
    }

    try {
      await addPlayerToTeamApi({ teamId: team.id, userId: value.id }).unwrap();
      revalidator.revalidate();
      success(`${t("messages:teams.added")} ${value.firstName} ${value.lastName} ${t("messages:teams.toTeam")}`);
    } catch (e) {
      console.error(e);
      error(t("error:error-message"))
    }
  }

  async function removePlayer(player: UserTeamSeason) {
    try {
      await removePlayerFromTeamApi({ teamId: team.id, userId: player.user.id });
      revalidator.revalidate();
      success(t("messages:teams.remove-player"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function updatePlayer(id: number, role: TeamFunction,) {
    try {
      await updatePlayerApi({ teamId: team.id, userId: id, func: role }).unwrap();
      revalidator.revalidate();
      success(t("messages:teams.role-update"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  if (!team) {
    return <Loading />
  }


  return (
    <>
      <Stack spacing={2}>
        <TeamsForm values={{ name: team.name, gender: team.gender, league: team.league }} submit={updateTeam} />
        <Card>
          <CardContent>
            <Button variant="contained" onClick={() => setVisible(true)}>
              <Add />
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
                  {team.userTeamSeason.map((player) => (
                    <TableRow key={player.user.id}>
                      <TableCell>{player.user.firstName} {player.user.lastName}</TableCell>
                      <TableCell>
                        <SelectRole id={player.id} role={player.function} onUpdate={(_id, role) => updatePlayer(player.user.id, role)} />
                      </TableCell>
                      <TableCell align="right">
                        <IconButton onClick={() => removePlayer(player)}>
                          <Delete />
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
        <DialogContent style={{ width: 400, height: 200 }}>
          <SearchUser onSelect={addUser} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:close")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
