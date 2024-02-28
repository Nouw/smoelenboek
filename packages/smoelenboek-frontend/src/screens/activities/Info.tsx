import React from "react";
import { useParams } from "react-router-dom";
import {
  useGetActivityQuery,
} from "../../api/endpoints/activity";
import { Loading } from "../../components/Loading";
import {
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import ReactHtmlParser from "react-html-parser";
import moment from "moment";
import { SignUp } from "../../components/activity/SignUp";
import { Participants } from "../../components/activity/Participants";

// TODO: Should add some event listener to send refresh event?
export const Info: React.FC = () => {
  const params = useParams();
  const { data, isLoading } = useGetActivityQuery(parseInt(params.id ?? ""), { refetchOnMountOrArgChange: true });
	const [refetchParticipants, setRefetchParticipants] = React.useState(false);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    // TODO: Should show correct error from API
    throw new Error("No data provided?");
  }

  const activity = data.data;

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h4">{activity.title}</Typography>
            <Typography variant="body1">
              {ReactHtmlParser(activity.description)}
            </Typography>
            <Divider />
            <Participants id={parseInt(params.id ?? "")} refetch={refetchParticipants} />
            {moment().isBefore(activity.registrationOpen) && (
              <Typography variant="h3" textAlign="center">
                Inschrijvingen open{" "}
                {moment(activity.registrationOpen).fromNow()}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>
      {moment().isAfter(activity.registrationOpen) &&
        moment().isBefore(activity.registrationClosed) && (
        <Card>
          <CardContent>
            <Stack spacing={1}>
              <Typography variant="h4">Inschrijf formulier</Typography>
              <SignUp title={activity.title} formId={activity.form.id} onSubmit={() => setRefetchParticipants(!refetchParticipants)} />
            </Stack>
          </CardContent>
        </Card>
      )}
    </Stack>
  );
};
