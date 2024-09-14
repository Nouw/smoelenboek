import React from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  ListItemIcon,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Delete, Download, Edit, RestartAlt } from "@mui/icons-material";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import { Options } from "../../../components/dashboard/options";
import { User } from "backend";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import { useDeleteUserMutation } from "../../../api/endpoints/user.api";
import { useRequestResetPasswordMutation } from "../../../api/endpoints/auth.api";

export const UsersList: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "options", "error", "messages"]);

  const users = useLoaderData() as User[];
  const isLoading = useNavigation().state === "loading";

  const [deleteUser] = useDeleteUserMutation();
  const [resetPassword] = useRequestResetPasswordMutation();
  //const [exportMembers, { isLoading: isExportLoading }] =
  //  useLazyGetExportQuery();

  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  async function removeUser() {
    const user = users[selected];

    try {
      await deleteUser(user.id).unwrap();

      setSelected(-1);
      setVisible(false);

      success(t("messages:user.delete"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }
  }

  async function requestResetPassword(email: string) {
    try {
      await resetPassword({ email });

      success(t("messages:auth.password.request-reset-admin"))
    } catch (e) {
      console.error(e);
      error(t("error:error-message"));
    }

    console.log(email);
  }

  async function exportToExcel() {
    //try {
    //  const blob = await exportMembers(null).unwrap();
    //
    //  const url = window.URL.createObjectURL(blob);
    //  const link = document.createElement("a");
    //  link.href = url;
    //  link.setAttribute("download", "export.xlsx");
    //
    //  document.body.appendChild(link);
    //  link.click();
    //
    //  link.parentNode?.removeChild(link);
    //  window.URL.revokeObjectURL(url);
    //} catch (e) {
    //  console.error(e);
    //}
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={2}>
      <Box>
        <LoadingButton
          loading={false}
          variant="contained"
          onClick={() => exportToExcel()}
					startIcon={<Download/>}
        >
					{t("user:export-to-excel")} 
        </LoadingButton>
      </Box>
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
            {users.map((user: User, key: number) => (
              <TableRow key={user.id}>
                <TableCell>{user.firstName} {user.lastName}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${user.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      {t("options:edit")}
                    </MenuItem>
                    <MenuItem onClick={() => requestResetPassword(user.email)}>
                      <ListItemIcon>
                        <RestartAlt />
                      </ListItemIcon>
                      {t("options:reset-password")}
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        setSelected(key);
                        setVisible(true);
                      }}
                    >
                      <ListItemIcon>
                        <Delete fontSize="small" />
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
            <DialogContentText>
              {t("common:confirmation")}
              {users[selected].firstName} {users[selected].lastName}?
            </DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>
            {t("common:cancel")}
          </Button>
          <Button variant="contained" onClick={() => removeUser()}>
            {t("common:remove")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
