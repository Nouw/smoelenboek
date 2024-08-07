import React from "react";
import moment from "moment";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Options } from "../../../components/dashboard/Options";
import { Add, Delete, Download, Edit } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  addSeasons,
  protototoSeasonSelector,
  removeSeason as removeSeasonState,
} from "../../../store/feature/protototo.slice";
import {
  useGetExportParticipantsMutation,
  useProtototoSeasonsMutation,
  useRemoveProtototoSeasonMutation,
} from "../../../api/endpoints/protototo";
import { Severity } from "../../../providers/SnackbarProvider";
import { SnackbarContext } from "../../../providers/SnackbarContext";
import { useTranslation } from "react-i18next";

interface HomeProps {
}

const FORMAT = "HH:mm DD-MM-YYYY";

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const snackbar = React.useContext(SnackbarContext);
  const seasons = useAppSelector(protototoSeasonSelector.selectAll);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["messages", "error", "options", "protototo"]);

  const [getSeasons] = useProtototoSeasonsMutation();
  const [removeSeasonApi] = useRemoveProtototoSeasonMutation();
  const [exportParticipants] = useGetExportParticipantsMutation();

  const [visible, setVisible] = React.useState(false);
  const [selected, setSelected] = React.useState(-1);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getSeasons(null).unwrap();

        dispatch(addSeasons(res.data));
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [dispatch, getSeasons]);

  async function removeSeason(id: number) {
    try {
      await removeSeasonApi(id);

      dispatch(removeSeasonState(id));

      snackbar.openSnackbar(
        t("messages:protototo.season.delete"),
        Severity.SUCCESS,
      );
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR);
    }
		setVisible(false);
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
                {t("protototo:id")}
              </TableCell>
              <TableCell>
                {t("protototo:start")}
              </TableCell>
              <TableCell>
                {t("protototo:end")}
              </TableCell>
              <TableCell align="right">
                {t("options:options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((season, key) => (
              <TableRow>
                <TableCell>{season.id}</TableCell>
                <TableCell>{moment(season.start).format(FORMAT)}</TableCell>
                <TableCell>{moment(season.end).format(FORMAT)}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`season/${season.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      {t("options:edit")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => navigate(`season/${season.id}/matches`)}
                    >
                      <ListItemIcon>
                        <Add fontSize="small" />
                      </ListItemIcon>
                      {t("options:add-match")}
                    </MenuItem>
                    <MenuItem onClick={() => {
											setSelected(key);
											setVisible(true);
											}}>
                      <ListItemIcon>
                        <Delete fontSize="small" />
                      </ListItemIcon>
                      {t("options:remove")}
                    </MenuItem>
                    <MenuItem onClick={() => exportPlayers(season.id)}>
                      <ListItemIcon>
                        <Download fontSize="small" />
                      </ListItemIcon>
                      {t("options:export-participants")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("protototo:delete-season")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && seasons[selected] !== undefined && (
            <DialogContentText>
              {t("common:confirmation")}: {" "}
              {moment(seasons[selected].start).format(FORMAT)} -{" "}
              {moment(seasons[selected].end).format(FORMAT)}?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={() => removeSeason(seasons[selected].id)}>
            {t("common:remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
