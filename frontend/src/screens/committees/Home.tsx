import React from "react";
import {useCommitteesQuery} from "../../api/endpoints/committees.ts";
import {Card, CardContent, Grid, Typography} from "@mui/material";
import {Loading} from "../../components/Loading.tsx";
import {useNavigate} from "react-router-dom";

interface HomeProps {
}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  const {data, isLoading} = useCommitteesQuery(null);

  if (isLoading || !data) return <Loading/>;

  return (
    <Grid container columns={8} spacing={2}>
      {data.data.map((committee) => (
        <Grid
          item
          lg={4}
          xs={8}
          onClick={() => navigate(`info/${committee.id}`)}
        >
          <Card key={committee.id} sx={{height: 96}}>
            <CardContent>
              <Typography variant="h5" textAlign="center">
                {committee.name}
              </Typography>
              <Typography color="text.secondary" textAlign="center">
                {committee.email}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
