import React from "react";
import { useGetParticipantsQuery } from "../../api/endpoints/activity";
import { Loading } from "../Loading";
import {
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from "@mui/material";

interface ParticipantsProps {
  id: string | number;
}

export const Participants: React.FC<ParticipantsProps> = ({ id }) => {
  const { data, isLoading } = useGetParticipantsQuery(id);

  if (isLoading) {
    return <Loading />;
  }

	if (!data?.data) {
		return null;
	}
	
	console.log(data);

  return (
    <List
      sx={{ maxHeight: 300, bgcolor: "background.paper" }}
      subheader={<ListSubheader>Aanwezig</ListSubheader>}
    >
      {data?.data.map((participant) => (
        <ListItemButton>
          <ListItemText>{ participant.user?.firstName} { participant.user?.lastName }</ListItemText>
        </ListItemButton>
      ))}
    </List>
  );
};