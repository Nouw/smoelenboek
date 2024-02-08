import React from "react";
import {
  Box,
  Card,
  CardContent,
  List, ListItem,
  ListItemButton,
  ListItemText,
  ListSubheader, MenuItem, Select,
  Stack,
  Typography
} from "@mui/material";
import {useTranslation} from "react-i18next";
import {useAppDispatch, useAppSelector} from "../../store/hooks";
import {setLanguage} from "../../store/feature/auth.slice";
import {useNavigate} from "react-router-dom";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  const { t } = useTranslation(["settings"]);
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.auth.language);
  const navigate = useNavigate();

  function changeLanguage(value: string) {
    dispatch(setLanguage(value));
  }

  return (
    <Stack gap={5}>
      <Card>
        <CardContent>
          <List subheader={
            <ListSubheader
              component="div"
              id="nested-list-subheader">
              {t("settings")}
            </ListSubheader>
          }
          >
            <ListItemButton onClick={() => navigate("password")}>
              <ListItemText primary={t("change-password")}/>
            </ListItemButton>
            <ListItemButton onClick={() => navigate("information")}>
              <ListItemText primary={t("update-information")}/>
            </ListItemButton>
            <ListItemButton onClick={() => navigate("picture")}>
              <ListItemText primary={t("change-profile-picture")}/>
            </ListItemButton>
          </List>
          <List subheader={
            <ListSubheader
              component="div"
              id="nested-list-subheader">
              {t("other-settings")}
            </ListSubheader>
          }>
            <ListItem>
              <Stack direction="row" alignItems="center" width="100%">
                <Typography variant="body1">{t("language")}</Typography>
                <Box sx={{ marginLeft: 'auto' }}>
                  <Select value={language} onChange={(event) => changeLanguage(event.target.value)}>
                    <MenuItem value={"nl"}>NL</MenuItem>
                    <MenuItem value={"en"}>EN</MenuItem>
                  </Select>
                </Box>
              </Stack>

            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Stack>
  )
}
