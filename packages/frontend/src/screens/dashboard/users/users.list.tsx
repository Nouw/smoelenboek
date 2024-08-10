import React from "react";
import {
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
import { Delete, Download, Edit, Upload } from "@mui/icons-material";
import { useLoaderData, useNavigate, useNavigation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LoadingButton } from "@mui/lab";
import { Options } from "../../../components/dashboard/options";
import { User } from "backend";
import { SnackbarContext } from "../../../providers/snackbar/snackbar.context";
import {
  useDeleteUserMutation,
  usePostImportUsersMutation,
} from "../../../api/endpoints/user.api";

export const UsersList: React.FC = () => {
  const { success, error } = React.useContext(SnackbarContext);
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "options", "error", "messages"]);

  const users = useLoaderData() as User[];
  const isLoading = useNavigation().state === "loading";

  const [deleteUser] = useDeleteUserMutation();
  const [importUsers, { isLoading: isImportLoading }] =
    usePostImportUsersMutation();
  //const [exportMembers, { isLoading: isExportLoading }] =
  //  useLazyGetExportQuery();

  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  const inputFile = React.createRef<HTMLInputElement>();

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

  async function uploadMembers() {
    const files = inputFile.current?.files;

    if (!files) {
      return;
    }

    if (files.length === 1) {
      const file = files[0];

      try {
        const form = new FormData();
        form.set("sheet", file);

        await importUsers(form).unwrap();

        success(t("messages:user.imported"));
      } catch (e) {
        console.error(e);
        error(t("error:error-message"));
      }
    }
  }

  if (isLoading) {
    return <CircularProgress />;
  }

  return (
    <Stack spacing={2}>
      <Stack spacing={2} direction="row">
        <LoadingButton
          disabled
          loading={false}
          variant="contained"
          onClick={() => exportToExcel()}
          startIcon={<Download />}
        >
          {t("user:export-to-excel")}
        </LoadingButton>
        <LoadingButton
          loading={isImportLoading}
          variant="contained"
          startIcon={<Upload />}
          onClick={() => inputFile.current?.click()}
        >
          {t("user:import")}
        </LoadingButton>
        <input
          type="file"
          id="file"
          ref={inputFile}
          onChange={() => uploadMembers()}
          style={{ display: "none" }}
        />
      </Stack>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("common:name")}</TableCell>
              <TableCell align="right">{t("options:options")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user: User, key: number) => (
              <TableRow key={user.id}>
                <TableCell>
                  {user.firstName} {user.lastName}
                </TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${user.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      {t("options:edit")}
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
};
