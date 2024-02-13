import React from "react";
import {
  Button, CircularProgress, Dialog,
  DialogActions,
  DialogContent, DialogContentText,
  DialogTitle,
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
import {Severity} from "../../../providers/SnackbarProvider";
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {useNavigate} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {useMembersMutation, useRemoveMemberMutation} from "../../../api/endpoints/members";
import {addMembers, membersSelector} from "../../../store/feature/members.slice";
import {useTranslation} from "react-i18next";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const snackbar = React.useContext(SnackbarContext);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const members = useAppSelector(membersSelector.selectAll);
  const { t } = useTranslation(["common", "options", "error", "messages"]);

  const [getMembers, { isLoading }] = useMembersMutation();
  const [removeMember] = useRemoveMemberMutation();


  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getMembers(null).unwrap();
        dispatch(addMembers(res.data));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getMembers])

  async function removeUser() {
    const member = members[selected];

    try {
      await removeMember(member.id).unwrap();

      setSelected(-1);
      setVisible(false);

      snackbar.openSnackbar(t("messages:user.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR)
    }
  }

  if (isLoading) {
    return <CircularProgress />
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                {t("common:name")}
              </TableCell>
              <TableCell align="right">
                {t("options:options")}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((member, key) => (
              <TableRow key={member.id}>
                <TableCell>{member.firstName} {member.lastName}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${member.id}`)}>
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
        <DialogTitle>{t("user:delete-user")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>{t("common:confirmation")}{members[selected].firstName} {members[selected].lastName}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={() => removeUser()}>{t("common:remove")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
