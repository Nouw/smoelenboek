import React from "react";
import {Box, Button, Card, CardContent, Stack, Typography} from "@mui/material";
import {useGetActivitiesQuery} from "../api/endpoints/activity.ts";
import {Loading} from "../components/Loading.tsx";
import moment from "moment";
import ReactHtmlParser from "react-html-parser";
import {useNavigate} from "react-router-dom";
import { Activity } from "smoelenboek-types";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();

  const {data, isLoading} = useGetActivitiesQuery(undefined);

  if (isLoading || !data) {
    return <Loading />
  }

  return <Box>
		<Stack spacing={2}>
    {data.data?.map((activity: Activity) => (
      <Card>
        <CardContent>
          <Stack direction="row">
            <Typography variant="h4">{activity.title}</Typography>
            <Button variant="contained" onClick={() => navigate(`/activity/${activity.id}`)} sx={{ ml: 'auto' }}>
              Info</Button>
          </Stack>
          <Typography variant="subtitle1"><b>Wanneer:</b> {moment(activity.date).format("dddd DD MMMM HH:mm")}</Typography>
          <Typography variant="subtitle1"><b>Waar:</b> {activity.location}</Typography>
          <Typography variant="body1">{ReactHtmlParser(activity.description)}</Typography>
        </CardContent>
      </Card>
    ))}
		</Stack>
  </Box>
}
