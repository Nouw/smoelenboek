import React from "react";
import {
  Button,
  Card,
  CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon, MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from "@mui/material";
import moment from "moment";
import {useNavigate, useParams} from "react-router-dom";
import {Options} from "../../../../components/dashboard/Options";
import {Delete, Edit, Flag} from "@mui/icons-material";
import {useAppDispatch, useAppSelector} from "../../../../store/hooks";
import {useLazyProtototoMatchesQuery, useProtototoRemoveMatchMutation} from "../../../../api/endpoints/protototo";
import {addMatches, protototoMatchSelector, removeMatch as removeMatchState} from "../../../../store/feature/protototo.slice";
import {Severity} from "../../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../../providers/SnackbarContext";
import {useTranslation} from "react-i18next";
import {ProtototoMatch} from "smoelenboek-types";
import { Response } from "../../../../api/API.ts";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const snackbar = React.useContext(SnackbarContext);

  const [getMatches] = useLazyProtototoMatchesQuery();
  const [removeMatchApi] = useProtototoRemoveMatchMutation();

  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  const matches = useAppSelector(protototoMatchSelector.selectAll);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getMatches(parseInt(params.id as string)).unwrap() as never as Response<ProtototoMatch[]>;
        dispatch(addMatches(res.data));
      } catch (e) {
        console.error(e);
      }
    }
    getData();
  }, [dispatch, getMatches, params.id]);

  async function removeMatch() {
    const match = matches[selected];

    try {
      await removeMatchApi(match.id);

      setSelected(-1);
      setVisible(false);

      dispatch(removeMatchState(match.id));

      snackbar.openSnackbar(t("messages:protototo.match.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR)
    }
  }

  return (
      <Card>
        <CardContent>
          <Button onClick={() => navigate('add')}>{t("protototo:add-match")}</Button>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t("protototo:play-date")}
                  </TableCell>
                  <TableCell>
                    {t("protototo:home")}
                  </TableCell>
                  <TableCell>
                    {t("protototo:away")}
                  </TableCell>
                  <TableCell align="right">
                    {t("options:options")}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {matches.map((match, key) => (
                  <TableRow>
                    <TableCell>{moment(match.playDate).format("HH:mm DD-MM-YYYY")}</TableCell>
                    <TableCell>{match.homeTeam}</TableCell>
                    <TableCell>{match.awayTeam}</TableCell>
                    <TableCell align="right">
                      <Options>
                        <MenuItem onClick={() => navigate(`/dashboard/protototo/season/${params.id}/matches/edit/${match.id}`)}>
                          <ListItemIcon>
                            <Edit fontSize="small"/>
                          </ListItemIcon>
                          {t("options:edit")}
                        </MenuItem>
                        <MenuItem onClick={() => navigate(`/dashboard/protototo/season/${params.id}/matches/result/${match.id}`)}>
                          <ListItemIcon>
                            <Flag fontSize="small"/>
                          </ListItemIcon>
												 {t("options:insert-result")} 
                        </MenuItem>
                        <MenuItem onClick={() => {
                          setSelected(key);
                          setVisible(true);
                        }}>
                          <ListItemIcon>
                            <Delete fontSize="small"/>
                          </ListItemIcon>
                          {t("options.remove")}
                        </MenuItem>
                      </Options>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>

        <Dialog open={visible} onClose={() => setVisible(false)}>
          <DialogTitle>{t("protototo:delete-match")}?</DialogTitle>
          <DialogContent>
            {selected >= 0 && matches[selected] !== undefined && (
              <>
                <DialogContentText>${t("common:confirmation")} {matches[selected].homeTeam} vs {matches[selected].awayTeam}?</DialogContentText>
                <br/>
                <DialogContentText fontWeight="bold">${t("protototo:predictions-alert")}!</DialogContentText>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVisible(false)}>{t("cancel")}</Button>
            <Button variant="contained" onClick={() => removeMatch()}>{t("remove")}</Button>
          </DialogActions>
        </Dialog>
      </Card>
  );
};
