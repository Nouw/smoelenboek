import { User } from "backend";
import React from "react";
import { useTranslation } from "react-i18next";
import { useLoaderData } from "react-router-dom";
import { Loading } from "../../components/loading";
import { Avatar, Box, Card, CardContent, Divider, List, ListItem, ListItemIcon, ListItemText, ListSubheader, Stack, Typography } from "@mui/material";
import { Add, CakeOutlined, Mail, Numbers, Phone, SportsVolleyball } from "@mui/icons-material";
import { Season } from "../../components/profile/season";
import SportsIcon from "@mui/icons-material/Sports";
import FmdGoodIcon from "@mui/icons-material/FmdGood";
import { format } from "date-fns";

export type UserExtended = typeof User & {
  seasons: Seasons;
};

interface CommitteeTeam {
  id: number;
  function: string;
  team?: never;
  committee?: never;
}

export interface Seasons {
  id: string;
  name: string;
  data: Array<CommitteeTeam>;
}

export const Profile: React.FC = () => {
  const { t } = useTranslation(["user"]);

  const user = useLoaderData() as UserExtended;
  //const [user, setUser] = React.useState<User>();
  const [seasons, setSeasons] = React.useState<Seasons[]>([]);

  React.useEffect(() => {
    const getData = async () => {
      try {
        if (!user) {
          return;
        }

        const keys = Object.keys(user.seasons);
        keys.reverse();
        const x = [];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          //@ts-expect-error stop yapping
          x.push(user.seasons[key]);
        }

        setSeasons(x);
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [user]);

  if (!user) {
    return <Loading />;
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Stack spacing={2} justifyContent="center" alignItems="center">
            <Avatar
              src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${user?.profilePicture}`}
              variant="square"
              sx={{ width: 200, height: 200 }}
            />
            <Typography variant="h5" textAlign="center">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography
              variant="h6"
              className="text-center"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${
                    encodeURIComponent(
                      `${user?.streetName} ${user?.houseNumber}`,
                    )
                  }`,
                )}
              color="primary"
              style={{ cursor: "pointer" }}
              textAlign="center"
            >
              <FmdGoodIcon /> {user?.streetName} {user?.houseNumber}
            </Typography>
          </Stack>
          <Divider />
          <List>
            <ListItem>
              <ListItemIcon>
                <Mail color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("email")}
                secondary={user?.email ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("phone-number")}
                secondary={user?.phoneNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CakeOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("birthdate")}
                secondary={format(user?.birthDate, "dd-MM-yyyy") ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SportsVolleyball color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("bond-number")}
                secondary={user?.bondNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Add color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("registration-date")}
                secondary={format(user?.joinDate, "dd-MM-yyyy") ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Numbers color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("back-number")}
                secondary={user?.backNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SportsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={t("referee-license")}
                secondary={user?.refereeLicense ?? "Geen"}
              />
            </ListItem>
          </List>
          <List
            subheader={<ListSubheader>{t("activities")}</ListSubheader>}
            sx={{ bgcolor: "background.paper" }}
          >
            {seasons.map((season) => <Season
              key={season.id}
              season={season}
            />)}
          </List>
        </CardContent>
      </Card>
    </Box>
  );
}
