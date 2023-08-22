import React from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {Options} from "../../../components/dashboard/Options";
import {Delete, Edit} from '@mui/icons-material';
import moment from "moment";
import {useNavigate} from 'react-router-dom';
import {SnackbarContext} from "../../../providers/SnackbarContext";
import {Severity} from "../../../providers/SnackbarProvider";
import {useAppDispatch} from "../../../store/hooks";
import {useRemoveMutation, useSeasonsMutation} from "../../../api/endpoints/season";
import {removeSeason, addSeasons, seasonsSelector} from "../../../store/feature/season.slice";
import {useSelector} from "react-redux";
import {useTranslation} from "react-i18next";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
    const navigate = useNavigate();
    const snackbar = React.useContext(SnackbarContext);
    const { t } = useTranslation();

    const dispatch = useAppDispatch();
    const [getSeasons, { isLoading }] = useSeasonsMutation();
    const [removeSeasonAPI] = useRemoveMutation();

    const seasons = useSelector(seasonsSelector.selectAll);

    // const [seasons, setSeasons] = React.useState<Season[]>([]);
    const [visible, setVisible] = React.useState<boolean>(false);
    const [selected, setSelected] = React.useState<number>(-1);

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

    function formatDate(date: string | Date) {
      return moment(date).format("D-M-YYYY")
    }

    async function deleteSeason() {
      try {
        const season = seasons[selected];

        await removeSeasonAPI(season.id).unwrap();
        dispatch(removeSeason(season.id));
        setSelected(-1);
        setVisible(false);

        snackbar.openSnackbar(t("message.season.delete"), Severity.SUCCESS);
      } catch (e) {
        console.error(e);
        snackbar.openSnackbar(t("errorMessage"), Severity.ERROR)
      }
    }

    if (isLoading || !seasons) {
      return <CircularProgress/>
    }

    return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("dashboard.season.name")}</TableCell>
              <TableCell>{t("dashboard.season.startDate")}</TableCell>
              <TableCell>{t("dashboard.season.endDate")}</TableCell>
              <TableCell align="right">{t("dashboard.options.options")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {seasons.map((season) => (
              <TableRow>
                <TableCell>{season.name}</TableCell>
                <TableCell>{formatDate(season.startDate)}</TableCell>
                <TableCell>{formatDate(season.endDate)}</TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${season.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small"/>
                      </ListItemIcon>
                      Edit
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setSelected(season.id);
                      setVisible(true);
                    }}>
                      <ListItemIcon>
                        <Delete fontSize="small"/>
                      </ListItemIcon>
                      Delete
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={visible} onClose={() => setVisible(false)}>
        <DialogTitle>Delete season?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>Are you sure you want to delete season {seasons[selected]?.name}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => deleteSeason()}>Delete</Button>
        </DialogActions>
      </Dialog>
    </>);
}

