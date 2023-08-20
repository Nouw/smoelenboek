import React from "react";
import {useLazyDocumentsCategoriesQuery } from "../../../api/endpoints/documents";
import {useAppDispatch, useAppSelector} from "../../../store/hooks";
import {addCategories, documentsSelector} from "../../../store/feature/documents.slice";
import {
  CircularProgress, ListItemIcon,
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

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [getCategories, { isLoading }] = useLazyDocumentsCategoriesQuery();

  const categories = useAppSelector(documentsSelector.selectAll).sort((a, b) => moment(a.created).unix() - moment(b.created).unix());

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
                {t("dashboard.documents.name")}
              </TableCell>
              <TableCell align="right">
                {t("dashboard.options.options")}
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
                      {t("dashboard.options.edit")}
                    </MenuItem>
                    <MenuItem onClick={() => {

                    }}>
                      <ListItemIcon>
                        <Delete fontSize="small"/>
                      </ListItemIcon>
                      {t("dashboard.options.remove")}
                    </MenuItem>
                  </Options>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}
