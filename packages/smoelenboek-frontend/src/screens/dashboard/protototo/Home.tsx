import React from "react";
import moment from "moment";
import {
  ListItemIcon,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import {Options} from "../../../components/dashboard/Options";
import {Add, Delete, Download, Edit} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addSeasons, protototoSeasonSelector, removeSeason as removeSeasonState} from "../../../store/feature/protototo.slice";
import {
  useGetExportParticipantsMutation,
  useProtototoSeasonsMutation,
  useRemoveProtototoSeasonMutation,
} from "../../../api/endpoints/protototo";
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {useTranslation} from "react-i18next";

interface HomeProps {

}

const FORMAT = "HH:mm DD-MM-YYYY";

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const snackbar = React.useContext(SnackbarContext);
  const seasons = useAppSelector(protototoSeasonSelector.selectAll);
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const [getSeasons] = useProtototoSeasonsMutation();
  const [removeSeasonApi] = useRemoveProtototoSeasonMutation();
  const [exportParticipants] = useGetExportParticipantsMutation();

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getSeasons(null).unwrap();

        dispatch(addSeasons(res.data));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getSeasons])

  async function removeSeason(id: number) {
    try {
      await removeSeasonApi(id);

      dispatch(removeSeasonState(id));

      snackbar.openSnackbar(t("message.protototo.season.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("errorMessage"), Severity.ERROR);
    }
  }

  function exportPlayers(id: number) {
    exportParticipants(id);
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("dashboard.protototo.id")}
              </TableCell>
              <TableCell>
                {t("dashboard.protototo.start")}
              </TableCell>
              <TableCell>
                {t("dashboard.protototo.end")}
              </TableCell>
              <TableCell align="right">
                {t("dashboard.protototo.options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((season) => (
              <TableRow>
                <TableCell>{season.id}</TableCell>
                <TableCell>{moment(season.start).format(FORMAT)}</TableCell>
                <TableCell>{moment(season.end).format(FORMAT)}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`season/${season.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.edit")}
                    </MenuItem>
                    <MenuItem onClick={() => navigate(`season/${season.id}/matches`)}>
                      <ListItemIcon>
                        <Add fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.addMatch")}
                    </MenuItem>
                    <MenuItem onClick={() => removeSeason(season.id)}>
                      <ListItemIcon>
                        <Delete fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.remove")}
                    </MenuItem>
                    <MenuItem onClick={() => exportPlayers(season.id)}>
                      <ListItemIcon>
                        <Download fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.exportParticipants")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
