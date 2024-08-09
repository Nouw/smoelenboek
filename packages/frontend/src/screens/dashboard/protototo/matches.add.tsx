import React from "react";
import {
  useGetNevoboTeamsQuery,
  useLazyGetNevoboMatchesQuery,
  useLazyGetNevoboTeamQuery,
} from "../../../api/endpoints/nevobo.api.ts";
import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Loading } from "../../../components/loading.tsx";
import { Team } from "../../../components/dashboard/protototo/team.tsx";
import { format } from "date-fns";
import { Add } from "@mui/icons-material";

export const MatchesAdd: React.FC = () => {
  const { data, isLoading } = useGetNevoboTeamsQuery(undefined);
  const [trigger, { data: matches, isLoading: matchesLoading }] =
    useLazyGetNevoboMatchesQuery();

  const [selectedTeam, setSelectedTeam] = React.useState<string>();

  React.useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    trigger(encodeURIComponent(selectedTeam));
  }, [selectedTeam]);

  if (isLoading || data == undefined) {
    return <Loading />;
  }

  return (
    <Card>
      <CardContent>
        <FormControl fullWidth>
          <InputLabel id="teams-select-label">Team</InputLabel>
          <Select
            labelId="teams-select-label"
            id="teams-select"
            value={selectedTeam}
            label="Age"
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            {data["hydra:member"].map((item) => (
              <MenuItem value={item["@id"]}>{item.naam}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Divider />
        {matchesLoading ? (
          <Loading />
        ) : (
          matches &&
          matches["hydra:member"]?.map((match) => (
            <Stack my={2} p={1} borderBottom={1}>
              <Stack direction="row" justifyContent="space-between">
                {match.teams.map((team) => (
                  <Team id={team} />
                ))}
              </Stack>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Datum
                </Typography>
                <Typography variant="body1">
                  {format(match.datum, "hh:mm dd-MM-yyyy")}
                </Typography>
              </Stack>
              <IconButton color="primary" sx={{ ml: "auto" }}>
                <Add />
              </IconButton>
            </Stack>
          ))
        )}
      </CardContent>
    </Card>
  );
};
