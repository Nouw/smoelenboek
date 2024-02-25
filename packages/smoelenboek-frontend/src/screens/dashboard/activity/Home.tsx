import React from "react";
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
import { useDeleteActivityMutation, useGetActivitiesQuery } from "../../../api/endpoints/activity.ts";
import { Loading } from "../../../components/Loading.tsx";
import { Options } from "../../../components/dashboard/Options.tsx";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Delete, Edit } from "@mui/icons-material";
import log from "../../../utilities/logger";
import { SnackbarContext } from "../../../providers/SnackbarContext.ts";
import { Severity } from "../../../providers/SnackbarProvider.tsx";


interface HomeProps {
}

export const Home: React.FC<HomeProps> = () => {
  const navigate = useNavigate();
  const { isLoading, data, refetch } = useGetActivitiesQuery(undefined, { refetchOnMountOrArgChange: true });
  const { t } = useTranslation(["common", "activity", "options", "api"]);
  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1);

	const [trigger] = useDeleteActivityMutation();

	const snackbar = React.useContext(SnackbarContext); 	

  if (isLoading) {
    return <Loading />;
  }

	if (data?.data === undefined) {
		// TODO: show info page
		log.debug("data is undefined, not showing activities");
		return null;
	}

	async function removeActivity() {
		if (!data?.data) {	
			return;
		}

		try {
			const res = await trigger(data.data[selected].id).unwrap();

			snackbar.openSnackbar(t(`api:${res.key}`, { name: data.data[selected].title }), Severity.SUCCESS);

			await refetch();
		} catch (e) {
			log.error(e);
			snackbar.openSnackbar(t('api:entity-deletion-failed'))
		}

		setVisible(false);
		setSelected(-1);
	}

  return (
    <>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t("activity:title")}</TableCell>
              <TableCell>{t("activity:date")}</TableCell>
              <TableCell align="right">{t("options:options")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data &&
              data.data.map((activity, key) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.title}</TableCell>
                  <TableCell>{activity.date.toString()}</TableCell>
                  <TableCell align="right">
                    <Options>
                      <MenuItem onClick={() => navigate(`edit/${activity.id}`)}>
                        <ListItemIcon>
                          <Edit fontSize="small" />
                        </ListItemIcon>
                        {t("options:edit")}
                      </MenuItem>
                      <MenuItem
                        onClick={() => {
                          setVisible(true);
                          setSelected(key);
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
      {data !== undefined && (
        <Dialog
          open={visible}
          onClose={() => setVisible(false)}
        >
          <DialogTitle>{t("committee:delete-committee")}?</DialogTitle>
          <DialogContent>
            {selected >= 0 && data.data[selected] !== undefined && (
              <DialogContentText>
                {t("common:confirmation")} {data.data[selected].title}?
              </DialogContentText>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVisible(false)}>
              {t("common:cancel")}
            </Button>
            <Button variant="contained" onClick={() => removeActivity()}>
              {t("common:remove")}
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
};
