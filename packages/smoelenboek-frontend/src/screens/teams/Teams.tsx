import React, {useEffect} from "react";
import {Navigate, useNavigate, useParams} from "react-router-dom";
import {Box, Card, CardContent, CardMedia, Grid, Typography} from "@mui/material";
import {useTeamsMutation} from "../../api/endpoints/team";
import { Team } from "smoelenboek-types";

interface TeamsProps {

}

export const Teams: React.FC<TeamsProps> = () => {
  const { type } = useParams();
  const navigate = useNavigate();

  const [getTeams] = useTeamsMutation();

  const [teams, setTeams] = React.useState<Team[]>([]);

  useEffect(() => {
    const getData = async () => {
      try {
        if (type !== "female" && type !== "male") {
          console.error("Unknown team type given");
          return;
        }

         const res = await getTeams({ type: type }).unwrap();

         setTeams(res.data);
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [getTeams, type])

  if (!type) {
    return <Navigate to="teams/female"/>
  }

  return <Box sx={{ flexGrow: 1, flex: 1 }} display="flex" justifyContent="center" alignItems="center">
  <Grid container gap={2} columns={{ xs: 4, lg: 8}} display="flex" justifyContent="center" >
    {teams.map((team, index) => (
      <Grid xs={4} lg={3} spacing={3} key={index}>
        <Card onClick={() => navigate(`/teams/info/${team.id}`)}>
          <CardMedia
            component="img"
            sx={{height: 194, top: 20}}
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
