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
import { Add, ArrowBack, ArrowLeft } from "@mui/icons-material";
import { useAddMatchMutation, useGetProtototoSeasonsQuery } from "../../../api/endpoints/protototo.api.ts";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context.ts";
import { isFetchBaseQueryError } from "../../../store/helpers.ts";

interface NevoboMatch {
  uuid: string,
  teams: string[],
  datum: string,
  tijdstip: string,
}

export const MatchesAdd: React.FC = () => {
  const { data, isLoading } = useGetNevoboTeamsQuery(undefined);
  const { t } = useTranslation(["messages", "error"]);
  const params = useParams();
  const { success, error } = React.useContext(SnackbarContext);
  const navigate = useNavigate(); 

  const [trigger, { data: matches, isLoading: matchesLoading }] =
    useLazyGetNevoboMatchesQuery();
  const [addMatch] = useAddMatchMutation();

  const [selectedTeam, setSelectedTeam] = React.useState<string>();

  React.useEffect(() => {
    if (!selectedTeam) {
      return;
    }

    trigger(encodeURIComponent(selectedTeam));
  }, [selectedTeam]);

  async function addMatchToSeason(match: NevoboMatch) {
    try {
      await addMatch({ seasonId: parseInt(params.id!), homeTeam: match.teams[0], awayTeam: match.teams[1], nevoboId: match.uuid }).unwrap();
      
      success(t('messages:protototo.match.added'))
    } catch (e) {
      console.error(e);
      if (isFetchBaseQueryError(e)) {
        if (e.status === 409) {
          error(t('messages:protototo.match.already-added'));
        }
      } else {
        error(t('error:error-message"'))
      }
    }
  }

  if (isLoading || data == undefined) {
    return <Loading />;
  }

  return (
    <>
      <Button onClick={() => navigate(-1)} startIcon={<ArrowBack />} variant="contained" sx={{ mb: 2 }}>{t("common:back")}</Button> 
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
                <IconButton color="primary" onClick={() => addMatchToSeason(match)} sx={{ ml: "auto" }}>
                  <Add />
                </IconButton>
              </Stack>
            ))
          )}
        </CardContent>
      </Card> 
    </>
  );
};
