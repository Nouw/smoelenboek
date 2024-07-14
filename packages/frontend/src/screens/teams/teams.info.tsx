import { Avatar, Box, Card, CardContent, CardMedia, Stack, Typography } from "@mui/material";
import { Team, UserTeamSeason } from "backend";
import React from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData, useNavigate, useNavigation, useParams } from "react-router-dom";
import { Loading } from "../../components/loading";

export const TeamsInfo: React.FC = () => {
const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation(["team", "functions"]);

  const navigation = useNavigation();
  const data = useLoaderData() as Team;
  const isLoading = navigation.state === "loading";

  const [team, setTeam] = React.useState<Team>();
  const [players, setPlayers] = React.useState<UserTeamSeason[]>([]);

  React.useEffect(() => {
    const getData = async () => {
      try {

        setTeam(data);
        setPlayers(data.userTeamSeason);
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [id, data]);

  function translateFunction(value: string): string {
    switch (value) {
      case "Setter":
        return t("functions:setter");
			case "Middle":
				return t("functions:middle");
			case "Outside hitter":
				return t("functions:outside-hitter");
			case "Opposite hitter":
				return t("functions:opposite-hitter");
			case "Libero":
				return t("functions:libero");
			case "Coach / Trainer":
				return t("functions:coach-trainer")
			default:
				return "";
    }
  }

  function renderPlayer(player: UserTeamSeason, filterCoaches = false) {
    if (filterCoaches && player["function"] === "Coach / Trainer") {
      return null;
    }

    return (
      <Stack
        direction="row"
        gap={2}
        onClick={() => navigate(`/profile/${player.user.id}`)}
      >
        <Avatar
          src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${player.user.profilePicture}`}
          sx={{ width: 64, height: 64 }}
        />
        <Box sx={{ marginTop: "auto", marginBottom: "auto" }}>
          <Typography>
            {player.user.firstName} {player.user.lastName}
          </Typography>
          <Typography color="text.secondary">{translateFunction(player.function)}</Typography>
        </Box>
      </Stack>
    );
  }

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Box
      sx={{ flexGrow: 1, flex: 1 }}
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <Card>
        <CardMedia
          component="img"
          src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${team?.image}`}
        />
        <CardContent>
          <Typography variant="h5" component="div">{team?.name}</Typography>
          <Typography color="text.secondary">{team?.rank}</Typography>
          <br />
          <Stack direction={{ sm: "column", lg: "row" }} spacing={2}>
            <Box flexGrow={1}>
              <Typography variant="h6">{t("team:players")}</Typography>
              <Stack direction="column" spacing={2}>
                {players.map((player) => renderPlayer(player, true))}
              </Stack>
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h6">{t("coaches")}</Typography>
              <Stack direction="column" spacing={2}>
                {players.map((player) =>
                  player["function"] === "Coach / Trainer"
                    ? renderPlayer(player)
                    : null
                )}
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
