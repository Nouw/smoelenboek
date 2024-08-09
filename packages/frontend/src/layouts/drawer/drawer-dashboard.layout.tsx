import { List } from "@mui/material";
import React from "react";
import { DrawerItem, DrawerItemComponent } from "./components/drawer.item";

const items: DrawerItem[] = [
  {
    title: "dashboard.go-back",
    translateHeader: true,
    navigateTo: "/teams/female",
  },
  {
    title: "dashboard.headers.activity-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.add-activity",
        navigateTo: "activity/create",
      },
      {
        title: "activities",
        navigateTo: "activity/",
      },
    ],
  },
  {
    title: "dashboard.headers.season-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.seasons",
        navigateTo: "dashboard/seasons/",
      },
      {
        title: "dashboard.add-season",
        navigateTo: "dashboard/seasons/add",
      },
    ],
  },
  {
    title: "dashboard.headers.user-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.users",
        navigateTo: "dashboard/users/",
      },
      {
        title: "dashboard.add-user",
        navigateTo: "dashboard/users/add",
      },
    ],
  },
  {
    title: "dashboard.headers.team-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.teams",
        navigateTo: "dashboard/teams/",
      },
      {
        title: "dashboard.add-team",
        navigateTo: "dashboard/teams/add",
      },
    ],
  },
  {
    title: "dashboard.headers.committee-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "committees",
        navigateTo: "dashboard/committees/",
      },
      {
        title: "dashboard.add-committee",
        navigateTo: "dashboard/committees/add",
      },
    ],
  },
  {
    title: "dashboard.headers.protototo-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.seasons",
        navigateTo: "protototo/",
      },
      {
        title: "dashboard.add-season",
        navigateTo: "dashboard/protototo/matches/add",
      },
    ],
  },
  {
    title: "dashboard.headers.documents-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.categories",
        navigateTo: "dashboard/documents/category/",
      },
      {
        title: "dashboard.add-category",
        navigateTo: "dashboard/documents/category/add",
      },
    ],
  },
];

export const DrawerDashboardLayout: React.FC = () => {
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
  );
};
