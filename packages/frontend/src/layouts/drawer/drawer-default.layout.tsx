import React from "react";
import { useAppSelector } from "../../store/hooks";
import isAuthenticated from "../../hooks/auth/is-authenticated.hook";
import { DrawerItem, DrawerItemComponent } from "./components/drawer.item";
import { List } from "@mui/material";

const publicItems: DrawerItem[] = [
  {
    title: "activities", // TODO: Should translate this
    subheader: false,
    navigateTo: "activities",
    rank: 1,
  },
  {
    title: "Protototo",
    subheader: true,
    subItems: [
      {
        title: "protototo.predict",
        navigateTo: "protototo",
      },
      // {
      //   title: "Leaderboards",
      //   navigateTo: ""
      // },
    ],
    rank: 4,
  },
];

const defaultItems: DrawerItem[] = [
  {
    title: "Teams",
    subheader: true,
    subItems: [
      {
        title: "teams.women",
        navigateTo: "teams/female",
      },
      {
        title: "teams.men",
        navigateTo: "teams/male",
      },
    ],
    rank: 2,
  },
  {
    title: "committees",
    subheader: false,
    navigateTo: "committees",
    rank: 3,
  },
  {
    title: "documents",
    navigateTo: "documents/",
    rank: 4,
  },
  {
    title: "Sponsorhengel",
    navigateTo: "sponsorhengel",
    rank: 5,
  },
  {
    title: "vcp",
    navigateTo: "vcp",
    rank: 6,
  },
];

const adminDefaultItem: DrawerItem = {
  title: "administration",
  subheader: true,
  translateHeader: true,
  subItems: [
    {
      title: "Dashboard",
      navigateTo: "dashboard/",
    },
  ],
  rank: Infinity
};

export const DrawerDefaultLayout: React.FC = () => {
  const role = useAppSelector(state => state.auth.role);
  const authenticated = isAuthenticated();

  const [items, setItems] = React.useState(publicItems);

  React.useEffect(() => {
    if (!authenticated) {
      setItems(publicItems);
      return;
    }

    const newItems = [...publicItems, ...defaultItems];
    if (role === "admin") {
      newItems.push(adminDefaultItem);
    }

    setItems(newItems.sort((a, b) => (a.rank ?? -1) - (b.rank ?? -1)));
  }, [authenticated, role])

  return (
    <List>
      {items.map((item) => (
        <>
          <DrawerItemComponent {...item} />
          {item.subItems &&
            item.subItems.map((subItem) => (
              <List sx={{ pl: 4 }} disablePadding>
                <DrawerItemComponent {...subItem} />
              </List>
            ))}
        </>
      ))}
    </List>
  )
}
