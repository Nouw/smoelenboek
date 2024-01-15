import React from "react";
import {Activity} from "smoelenboek-types";
import {Button, Card, CardContent, Stack, Typography} from "@mui/material";
import moment from "moment";
import ReactHtmlParser from "react-html-parser";
import {useNavigate} from "react-router-dom";

interface InfoProps {
  activity: Activity;
  signUp?: boolean;
}

export const Info: React.FC<InfoProps> = ({activity, signUp = false}) => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Stack direction="row">
          <Typography variant="h4">{activity.title}</Typography>
          { signUp && <Button variant="contained"
                  disabled={moment().isBefore(activity.registrationOpen) || moment().isAfter(activity.registrationClosed)}
                  onClick={() => navigate(`/activity/${activity.id}`)} sx={{ml: 'auto'}}>
            {moment().isBefore(activity.registrationOpen) ? moment(activity.registrationOpen).fromNow(true) : "inschrijven"}
          </Button> }
        </Stack>
        <Typography variant="subtitle1"><b>Wanneer:</b> {moment(activity.date).format("dddd DD MMMM HH:mm")}
        </Typography>
        <Typography variant="subtitle1"><b>Waar:</b> {activity.location}</Typography>
        <Typography variant="body1">{ReactHtmlParser(activity.description)}</Typography>
      </CardContent>
    </Card>
  )
}
