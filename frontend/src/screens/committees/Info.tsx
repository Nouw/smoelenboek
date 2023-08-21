import React from "react";
import {useNavigate, useParams} from "react-router-dom";
import {
  useGetCommitteeQuery,
  Member,
} from "../../api/endpoints/committees.ts";
import {Loading} from "../../components/Loading.tsx";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

interface InfoProps {
}

export const Info: React.FC<InfoProps> = () => {
  const {id} = useParams();
  const navigate = useNavigate();

  const {data, isLoading} = useGetCommitteeQuery(parseInt(id ?? "0"));
  const committee = data?.data;

  function renderMember(member: Member) {
    return (
      <Stack
        direction="row"
        gap={2}
        onClick={() => navigate(`/profile/${member.user.id}`)}
      >
        <Avatar
          src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${
            member.user.profilePicture
          }`}
          sx={{width: 64, height: 64}}
        />
        <Box sx={{marginTop: "auto", marginBottom: "auto"}}>
          <Typography>
            {member.user.firstName} {member.user.lastName}
          </Typography>
          <Typography color="text.secondary">{member.function}</Typography>
        </Box>
      </Stack>
    );
  }

  if (isLoading) return <Loading/>;

  return (
    <Card>
      <CardMedia
        component="img"
        src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${
          committee?.committee.image
        }`}
      />
      <CardContent>
        <Typography variant="h5" component="div">
          {committee?.committee.name}
        </Typography>
        <Typography color="text.secondary">{committee?.committee.email}</Typography>
        <br/>
        <Grid container columns={8} spacing={2}>
          {committee?.members.map((member) => (
            <Grid item xs={8} lg={4}>
              {renderMember(member)}
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
};
