import React from "react";
import {
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppSelector } from "../../store/hooks";
import { useTranslation } from "react-i18next";
import { Roles } from "smoelenboek-types";
import { useIsAnonymous } from "../../hooks/useIsAnonymous";
import { useLazyGetManagedActivitiesQuery } from "../../api/endpoints/activity";
import { getIn } from "formik";

interface DrawerItemsProps {
  admin?: boolean;
}

interface DrawerItem {
  title: string;
  navigateTo?: string;
  subheader?: boolean;
  subItems?: DrawerItem[];
  translateHeader?: boolean;
  rank?: number; // Bigger the number the lower in the list
}

const publicItems: DrawerItem[] = [
  {
    title: "activities", // TODO: Should translate this
    subheader: false,
    navigateTo: "home",
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

const adminItems: DrawerItem[] = [
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
        navigateTo: "activity/create"
      },
      {
        title: "activities",
        navigateTo: "activity/"
      }
    ]
  },
  {
    title: "dashboard.headers.season-management",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.seasons",
        navigateTo: "seasons/",
      },
      {
        title: "dashboard.add-season",
        navigateTo: "seasons/add",
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
        navigateTo: "users/",
      },
      {
        title: "dashboard.add-user",
        navigateTo: "users/add",
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
        navigateTo: "teams/",
      },
      {
        title: "dashboard.add-team",
        navigateTo: "teams/add",
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
        navigateTo: "committees/",
      },
      {
        title: "dashboard.add-committee",
        navigateTo: "committees/add",
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
        navigateTo: "protototo/season",
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
        navigateTo: "documents/",
      },
      {
        title: "dashboard.add-category",
        navigateTo: "documents/category",
      },
    ],
  },
];

const DrawerItemComponent: React.FC<DrawerItem> = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation("navigation");

  if (props.subheader) {
    return (
      <ListSubheader>
        {props.translateHeader ? t(props.title) : props.title}
      </ListSubheader>
    );
  }

  function onClick() {
    if (props.navigateTo) {
      navigate(props.navigateTo);
    }
  }

  return (
    <ListItemButton onClick={() => onClick()}>
      <ListItemText primary={t(props.title)} />
    </ListItemButton>
  );
};

export const DrawerItems: React.FC<DrawerItemsProps> = () => {
  const roles = useAppSelector((state) => state.auth.roles);
  const isAnonymous = useIsAnonymous();
  const [trigger] = useLazyGetManagedActivitiesQuery();

  const [items, setItems] = React.useState<DrawerItem[]>(publicItems);

  const location = useLocation();

  React.useEffect(() => {
    const getItems = async () => {
      if (isAnonymous || location.pathname.includes("dashboard")) {
        return;
      }

      let newItems: DrawerItem[] = [...publicItems, ...defaultItems]

      if (!isAnonymous) {
        newItems = [...newItems, await getManagedActivities()];
      }

      if (
        (roles.includes(Roles.ADMIN) || roles.includes(Roles.BOARD)) &&
        !location.pathname.includes("dashboard")
      ) {
        newItems = [...newItems, adminDefaultItem];
      }

      setItems(newItems.sort((a, b) => (a.rank ?? -1) - (b.rank ?? -1)));
    }

    getItems();
  }, [location.pathname, roles, isAnonymous]);

  React.useEffect(() => {
    if (location.pathname.includes("dashboard")) {
      setItems(adminItems);
    }
  }, [location.pathname]);

  async function getManagedActivities(): Promise<DrawerItem> {
    const res = await trigger(null);

    return {
      title: "Activiteiten beheer",
      subheader: true,
      rank: Infinity,
      subItems: res.data?.data?.map((activity) => ({
        title: activity.title,
        navigateTo: `activity/info/${activity.id}`
      }))
    }
  }

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
