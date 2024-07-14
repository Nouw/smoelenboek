import { Box, Card, CardContent, CardMedia, Grid, Typography } from "@mui/material";
import React from "react";
import { Navigate, useLoaderData, useNavigate, useNavigation, useParams } from "react-router-dom";
import { Team } from "backend";
import { Loading } from "../../components/loading";

export const TeamsList: React.FC = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const data = useLoaderData() as Team[];

  const [teams, setTeams] = React.useState<Team[]>([]);

  React.useEffect(() => {
    const getData = async () => {
      try {
        if (!data) {
          return;
        }

        if (type !== "female" && type !== "male") {
          console.error("Unknown team type given");
          return;
        }

        setTeams(data.filter((t: Team) => t.gender === type))
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [data, type])

  if (navigation.state === "loading") {
    return <Loading />
  }

  if (!type) {
    return <Navigate to="teams/female" />
  }

  return <Box sx={{ flexGrow: 1, flex: 1 }} display="flex" justifyContent="center" alignItems="center">
    <Grid container gap={2} columns={{ xs: 4, lg: 8 }} spacing={3} display="flex" justifyContent="center" >
      {teams.map((team, index) => (
        <Grid item xs={4} lg={3} key={index}>
          <Card onClick={() => navigate(`/teams/info/${team.id}`)}>
            <CardMedia
              component="img"
              sx={{ height: 194, top: 20 }}
              src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${team.image}`}
            />
            <CardContent>
              <Typography>{team.name}</Typography>
              <Typography color="text.secondary">
                {team.rank}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  </Box>
}
