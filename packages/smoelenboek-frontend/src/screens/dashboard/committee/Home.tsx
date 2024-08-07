import React from "react";
import {
  Button,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
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
import {Delete, Edit} from "@mui/icons-material";
import {useNavigate} from "react-router-dom";
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addCommittees, committeesSelector} from "../../../store/feature/committees.slice";
import {useLazyCommitteesQuery, useRemoveCommitteeMutation} from "../../../api/endpoints/committees";
import { removeCommittee as removeCommitteeState } from "../../../store/feature/committees.slice";
import {useTranslation} from "react-i18next";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const snackbar = React.useContext(SnackbarContext);
  const dispatch = useAppDispatch();
  const { t } = useTranslation(["common", "messages", "error", "options"]);

  const [getCommittees] = useLazyCommitteesQuery();
  const [removeCommitteeApi] = useRemoveCommitteeMutation();

  const committees = useAppSelector(committeesSelector.selectAll);

  // const [committees, setCommittees] = React.useState<Committee[]>([]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getCommittees(null).unwrap();

        dispatch(addCommittees(res.data));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getCommittees])

  async function removeCommittee() {
    const committee = committees[selected];

    try {
      await removeCommitteeApi(committee.id);

      setSelected(-1);
      setVisible(false);

      dispatch(removeCommitteeState(committee.id));

      snackbar.openSnackbar(t("message:committee.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR)
    }
  }

  if (committees.length < 1) {
    return <CircularProgress/>
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("committee:name")}
              </TableCell>
              <TableCell align="right">
                {t("options:options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {committees.map((committee, key) => (
              <TableRow key={committee.id}>
                <TableCell>{committee.name}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${committee.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small"/>
                      </ListItemIcon>
                      {t("options:edit")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setSelected(key);
                      setVisible(true);
                    }}>
                      <ListItemIcon>
                        <Delete fontSize="small"/>
                      </ListItemIcon>
                      {t("options:remove")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("committee:delete-committee")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && committees[selected] !== undefined && (
            <DialogContentText>{t("common:confirmation")} {committees[selected].name}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={() => removeCommittee()}>{t("common:remove")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
