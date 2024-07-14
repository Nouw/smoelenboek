import { Card, CardContent, Grid, Typography } from "@mui/material";
import React from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { Loading } from "../../components/loading";
import { Committee } from "backend";

export const CommitteesList: React.FC = () => {
  const navigate = useNavigate();
  const navigation = useNavigation(); 
  
  const data = useLoaderData() as Committee[];

  if (navigation.state === "loading") {
    return <Loading/>
  }

  return (
    <Grid container columns={8} spacing={2}>
      {data.map((committee) => (
        <Grid
          item
          lg={4}
          xs={8}
          onClick={() => navigate(`info/${committee.id}`)}
        >
          <Card key={committee.id} sx={{ height: 96 }}>
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
}
