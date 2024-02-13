import React from "react";
import {useDocumentsDeleteCategoryMutation, useLazyDocumentsCategoriesQuery} from "../../../api/endpoints/documents";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addCategories, documentsSelector} from "../../../store/feature/documents.slice";
import {
  Button,
  CircularProgress, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, ListItemIcon,
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
import {Category} from "smoelenboek-types";
import moment from "moment";
import {useTranslation} from "react-i18next";
import {removeSeason} from "../../../store/feature/season.slice.ts";
import {Severity} from "../../../providers/SnackbarProvider.tsx";
import {SnackbarContext} from "../../../providers/SnackbarContext.ts";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation(["common", "error", "messages", "options"]);
  const snackbar = React.useContext(SnackbarContext);

  const [getCategories, { isLoading }] = useLazyDocumentsCategoriesQuery();
  const [removeCategoryAPI] = useDocumentsDeleteCategoryMutation();

  const categories = useAppSelector(documentsSelector.selectAll).sort((a, b) => moment(a.created).unix() - moment(b.created).unix());

  const [visible, setVisible] = React.useState<boolean>(false);
  const [selected, setSelected] = React.useState<number>(-1)

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await getCategories(true).unwrap();

        dispatch(addCategories(res.data as Category[]));
      } catch (e) {
        console.error(e);
      }
    }

    getData();
  }, [dispatch, getCategories])

  async function deleteCategory() {
    try {
      const category = categories.find((x) => x.id === selected);

      if (!category) {
        return;
      }

      await removeCategoryAPI(category.id).unwrap();
      dispatch(removeSeason(category.id));
      setSelected(-1);
      setVisible(false);

      snackbar.openSnackbar(t("messages:documents.delete"), Severity.SUCCESS);
    } catch (e) {
      console.error(e);
      snackbar.openSnackbar(t("error:error-message"), Severity.ERROR)
    }
  }

  if (isLoading) {
    return <CircularProgress/>
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
            {categories.map((category) => (
              <TableRow>
                <TableCell>
                  {category.name}
                </TableCell>
                <TableCell align="right">
                  <Options>
                    <MenuItem onClick={() => navigate(`edit/${category.id}`)}>
                      <ListItemIcon>
                        <Edit fontSize="small"/>
                      </ListItemIcon>
                      {t("options:edit")}
                    </MenuItem>
                    <MenuItem onClick={() => {
                      setVisible(true);
                      setSelected(category.id);
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
        <DialogTitle>{t("documents:delete-category")}?</DialogTitle>
        <DialogContent>
          {selected >= 0 && (
            <DialogContentText>{t("common:confirmation")} {categories[selected]?.name}?</DialogContentText>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisible(false)}>{t("common:cancel")}</Button>
          <Button variant="contained" onClick={() => deleteCategory()}>{t("common:delete")}</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
