import {Avatar, Box, Card, CardContent, CardMedia, CircularProgress, Stack, Typography} from "@mui/material";
import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {useTranslation} from "react-i18next";
import {useTeamInfoMutation} from "../../api/endpoints/team";

interface InfoProps {

}

export interface TeamData {
  id: number;
  function: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
  };
  team: {
    name: string;
    rank: string;
  };
}

interface Player {
  id: number;
  function: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    profilePicture: string;
  };
}

interface Team {
  gender: "male" | "female",
  id: number,
  image: string,
  name: string,
  rank: string
}


export const Info: React.FC<InfoProps> = () => {
  const {id} = useParams();
  const navigate = useNavigate();
  const i18n = useTranslation();

  const [trigger, { isLoading }] = useTeamInfoMutation();

  const [team, setTeam] = React.useState<Team>();
  const [players, setPlayers] = React.useState<Player[]>([]);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await trigger(parseInt(id ?? "0")).unwrap();

        console.log(res);
        setTeam(res.data.teamInfo as unknown as Team);
        setPlayers(res.data.players);
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [id, trigger])

  function renderPlayer(player: Player, filterCoaches = false) {
    if (filterCoaches && player["function"] === "Coach / Trainer") {
      return null
    }

    return (
      <Stack direction="row" gap={2} onClick={() => navigate(`/profile/${player.user.id}`)}>
        <Avatar src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${player.user.profilePicture}`}
                sx={{width: 64, height: 64}}/>
        <Box sx={{marginTop: "auto", marginBottom: "auto"}}>
          <Typography>{player.user.firstName} {player.user.lastName}</Typography>
          <Typography color="text.secondary">{player.function}</Typography>
        </Box>
      </Stack>
    )
  }

  if (isLoading) {
    return <CircularProgress/>
  }

  return (
    <Box sx={{flexGrow: 1, flex: 1}} display="flex" justifyContent="center" alignItems="center">
      <Card>
        <CardMedia component="img" src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${team?.image}`}/>
        <CardContent>
          <Typography variant="h5" component="div">{team?.name}</Typography>
          <Typography color="text.secondary">{team?.rank}</Typography>
          <br/>
          <Stack direction={{sm: "column", lg: "row"}} spacing={2}>
            <Box flexGrow={1}>
              <Typography variant="h6">{i18n.t("players")}</Typography>
              <Stack direction="column" spacing={2}>
                {players.map((player) => renderPlayer(player, true))}
              </Stack>
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h6">{i18n.t("coaches")}</Typography>
              <Stack direction="column" spacing={2}>
                {players.map((player) => player["function"] === "Coach / Trainer" ? renderPlayer(player) : null)}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
