import React from 'react';
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
  TableRow
} from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';
import { useLoaderData, useNavigate, useNavigation, useRevalidator } from 'react-router-dom';
import { useTranslation } from "react-i18next";
import { format } from 'date-fns';
import { SnackbarContext } from '../../../providers/snackbar/snackbar.context';
import { Loading } from '../../../components/loading';
import { Season } from 'backend';
import { useDeleteSeasonMutation } from '../../../api/endpoints/seasons.api';
import { Options } from '../../../components/dashboard/options';

export const SeasonsList: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = React.useContext(SnackbarContext);
  const { t } = useTranslation(["common", "options", "error", "messages", "season"]);

  const seasons = useLoaderData() as Season[];
  const revalidator = useRevalidator();
  const navigation = useNavigation();

  const [removeSeasonTrigger] = useDeleteSeasonMutation();
  
  
  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

  function formatDate(date: string | Date) {
    return format(date, "d-M-yyyy")
  }

  async function deleteSeason() {
    try {
      const season = seasons[selected];

      await removeSeasonTrigger(season.id).unwrap();
      setSelected(-1);
      setVisible(false);
      revalidator.revalidate();

      success(t("messages:season.delete"));
    } catch (e) {
      console.error(e);
      error(t("error:error-message"))
    }
  }

  if (navigation.state === "loading") {
    return <Loading />
  }

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("season:name")}</TableCell>
              <TableCell>{t("season:start-date")}</TableCell>
              <TableCell>{t("season:end-date")}</TableCell>
              <TableCell align="right">{t("options:options")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((season, key) => (
              <TableRow>
                <TableCell>{season.name}</TableCell>
                <TableCell>{formatDate(season.startDate)}</TableCell>
                <TableCell>{formatDate(season.endDate)}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${season.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small" />
                      </ListItemIcon>
                      {t("options:edit")}
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
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>{t("season:delete-season")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>{t("common:confirmation")} {seasons[selected]?.name}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={() => deleteSeason()}>{t("common:delete")}</Button>
        </DialogActions>
      </Dialog>
    </>);
}
