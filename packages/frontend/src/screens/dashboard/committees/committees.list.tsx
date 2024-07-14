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
import { useLoaderData, useNavigate } from "react-router-dom";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useTranslation } from "react-i18next";
import { Committee } from "backend";
import { Options } from "../../../components/dashboard/options";
import { Delete, Edit } from "@mui/icons-material";
import { useDeleteCommiteeMutation } from "../../../api/endpoints/committees.api";

export const CommitteesList: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["common", "messages", "error", "options"]);

  const [deleteCommittee] = useDeleteCommiteeMutation ();
  
  const committees = useLoaderData() as Committee[];

  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  async function removeCommittee() {
    const committee = committees[selected];

    try {
      await deleteCommittee(committee.id);

      setSelected(-1);
      setVisible(false);


      success(t("message:committee.delete"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"))
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
function useDeleteCommitteeMutation(): [any] {
    throw new Error("Function not implemented.");
}

