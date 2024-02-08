import React from "react";
import { useParams } from "react-router-dom";
import {
  Avatar,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Typography,
} from "@mui/material";
import SportsIcon from "@mui/icons-material/Sports";
import FmdGoodIcon from "@mui/icons-material/FmdGood";
import Mail from "@mui/icons-material/Mail";
import {
  Add,
  CakeOutlined,
  Numbers,
  Phone,
  SportsVolleyball,
} from "@mui/icons-material";
import moment from "moment";
import { Season } from "../components/profile/Season";
import { useTranslation } from "react-i18next";
import { useLazyGetUserProfileQuery } from "../api/endpoints/user";

interface ProfileProps {
}

interface User {
  backNumber: number | null;
  bankaccountNumber: string;
  birthDate: string;
  bondNumber: string;
  city: string;
  email: string;
  firstName: string;
  houseNumber: string;
  id: number;
  joinDate: string;
  lastName: string;
  leaveDate: string | null;
  phoneNumber: string;
  postcode: string;
  streetName: string;
  seasons: Seasons;
  profilePicture?: string;
  refereeLicense?: string;
}

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

export const Profile: React.FC<ProfileProps> = () => {
  const { id } = useParams();
  const i18n = useTranslation();

  const [user, setUser] = React.useState<User>();
  const [seasons, setSeasons] = React.useState<Seasons[]>([]);

  const [trigger] = useLazyGetUserProfileQuery();

  React.useEffect(() => {
    const getData = async () => {
      try {
        const res = await trigger(parseInt(id ?? "1")).unwrap();

        setUser(res.data as unknown as User);

        const keys = Object.keys(res.data.seasons);
        keys.reverse();
        const x = [];

        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];

          x.push(res.data.seasons[key]);
        }

        setSeasons(x);
      } catch (e) {
        console.error(e);
      }
    };

    getData();
  }, [id, trigger]);

  if (!user) {
    return <CircularProgress />;
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
                primary={i18n.t("email")}
                secondary={user?.email ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Phone color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("phoneNumber")}
                secondary={user?.phoneNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CakeOutlined color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("birthdate")}
                secondary={moment(user?.birthDate).format(
                  "D-MM-YYYY",
                ) ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SportsVolleyball color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("bondNumber")}
                secondary={user?.bondNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Add color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("registrationDate")}
                secondary={moment(user?.joinDate).format(
                  "D-MM-YYYY",
                ) ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <Numbers color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("backNumber")}
                secondary={user?.backNumber ?? ""}
              />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <SportsIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={i18n.t("refereeLicense")}
                secondary={user?.refereeLicense ?? "Geen"}
              />
            </ListItem>
          </List>
          <List
            subheader={<ListSubheader>{i18n.t("activities")}</ListSubheader>}
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
};
