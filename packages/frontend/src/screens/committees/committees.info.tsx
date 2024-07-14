import { Avatar, Box, Card, CardContent, CardMedia, Grid, Stack, Typography } from "@mui/material";
import { Committee, UserCommitteeSeason } from "backend";
import React from "react";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { Loading } from "../../components/loading";

export const CommitteesInfo: React.FC = () => {
  const navigate = useNavigate();
  const data = useLoaderData() as Committee;
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const committee = data;

  function renderMember(member: UserCommitteeSeason) {
    return (
      <Stack
        direction="row"
        gap={2}
        onClick={() => navigate(`/profile/${member.user.id}`)}
      >
        <Avatar
          src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${member.user.profilePicture
            }`}
          sx={{ width: 64, height: 64 }}
        />
        <Box sx={{ marginTop: "auto", marginBottom: "auto" }}>
          <Typography>
            {member.user.firstName} {member.user.lastName}
          </Typography>
          <Typography color="text.secondary">{member.function}</Typography>
        </Box>
      </Stack>
    );
  }

  if (isLoading) return <Loading />;

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
          src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${committee?.image
            }`}
        />
        <CardContent>
          <Typography variant="h5" component="div">
            {committee?.name}
          </Typography>
          <Typography color="text.secondary">{committee?.email}</Typography>
          <br />
          <Grid container columns={8} spacing={2}>
            {committee?.userCommitteeSeason.map((member: UserCommitteeSeason) => (
              <Grid item xs={8} lg={4}>
                {renderMember(member)}
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>);
}
