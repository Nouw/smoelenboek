import React from "react";
import {
  useGetNevoboTeamsQuery,
  useLazyGetNevoboMatchesQuery,
} from "../../../api/endpoints/nevobo.api.ts";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
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
import { useGetProtototoSeasonsQuery } from "../../../api/endpoints/protototo.api.ts";
import { useTranslation } from "react-i18next";

interface NevoboMatch {
  uuid: string,
  teams: string[],
  datum: string,
  tijdstip: string,
}

export const MatchesAdd: React.FC = () => {
  const { data, isLoading } = useGetNevoboTeamsQuery(undefined);
  const { t } = useTranslation();

  const [trigger, { data: matches, isLoading: matchesLoading }] =
    useLazyGetNevoboMatchesQuery();
  const { data: seasons, isLoading: isSeasonsLoading } = useGetProtototoSeasonsQuery()

  const [selectedTeam, setSelectedTeam] = React.useState<string>();
  const [visible, setVisible] = React.useState(false);
  const [selectedSeason, setSelectedSeason] = React.useState<number>();
  const [selectedMatch, setSelectedMatch] = React.useState<NevoboMatch>();

  React.useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    trigger(encodeURIComponent(selectedTeam));
  }, [selectedTeam]);

  async function addMatchToSeason() {
    console.log(selectedMatch, selectedSeason);
    setVisible(false);
  }

  if (isLoading || isSeasonsLoading || data == undefined) {
    return <Loading />;
  }

  return (
    <>
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
            matches["hydra:member"]?.map((match: NevoboMatch) => (
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
                <IconButton color="primary" onClick={() => { setSelectedMatch(match); setVisible(true) }} sx={{ ml: "auto" }}>
                  <Add />
                </IconButton>
              </Stack>
            ))
          )}
        </CardContent>
      </Card>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>Debug</DialogTitle>
        <DialogContent>
          <FormControl fullWidth>
            <InputLabel id="seasons-select-label">Seasons</InputLabel>
            <Select
              labelId="seasons-select-label"
              id="seasons-select"
              value={selectedSeason}
              label="Seasons"
              onChange={(e) => setSelectedSeason(parseInt(e.target.value as string))}
            >
              {seasons?.map((season) => (
                <MenuItem value={season.id}>{format(season.start, 'hh:mm dd-MM-yyyy')} - {format(season.end, 'hh:mm dd-MM-yyyy')}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>
            {t("common:cancel")}
          </Button>
          <Button onClick={() => addMatchToSeason()}>
            {t("common:submit")}
          </Button>
        </DialogActions>
      </Dialog>

    </>
  );
};
