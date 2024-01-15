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
    title: "Activeiten", // TODO: Should translate this
    subheader: false,
    navigateTo: "home",
    rank: 1,
  },
  {
    title: "Protototo",
    subheader: true,
    subItems: [
      {
        title: "navigation.protototo.predict",
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
        title: "navigation.teams.women",
        navigateTo: "teams/female",
      },
      {
        title: "navigation.teams.men",
        navigateTo: "teams/male",
      },
    ],
    rank: 2,
  },
  {
    title: "navigation.committees",
    subheader: false,
    navigateTo: "committees",
    rank: 3,
  },
  {
    title: "navigation.documents",
    navigateTo: "documents/",
		rank: 4,
  },
  {
    title: "Sponsorhengel",
    navigateTo: "sponsorhengel",
		rank: 5,
  },
  {
    title: "navigation.vcp",
    navigateTo: "vcp",
		rank: 6,
  },
];

const adminDefaultItem: DrawerItem = {
  title: "navigation.administration",
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
    title: "dashboard.goBack",
    translateHeader: true,
    navigateTo: "/teams/female",
  },
  {
    title: "dashboard.form.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.form.createForm",
        navigateTo: "form/create",
      },
    ],
  },
  {
    title: "Activity",
    subheader: true,
    translateHeader: false,
    subItems: [
      {
        title: "Create Activity",
        navigateTo: "activity/"
      }
    ]
  },
  {
    title: "dashboard.season.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.season.seasons",
        navigateTo: "seasons/",
      },
      {
        title: "dashboard.season.createSeason",
        navigateTo: "seasons/add",
      },
    ],
  },
  {
    title: "dashboard.user.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.user.users",
        navigateTo: "users/",
      },
      {
        title: "dashboard.user.createUser",
        navigateTo: "users/add",
      },
    ],
  },
  {
    title: "dashboard.team.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.team.teams",
        navigateTo: "teams/",
      },
      {
        title: "dashboard.team.createTeam",
        navigateTo: "teams/add",
      },
    ],
  },
  {
    title: "dashboard.committee.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.committee.committees",
        navigateTo: "committees/",
      },
      {
        title: "dashboard.committee.createCommittee",
        navigateTo: "committees/add",
      },
    ],
  },
  {
    title: "dashboard.protototo.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.protototo.seasons",
        navigateTo: "protototo/",
      },
      {
        title: "dashboard.protototo.createSeason",
        navigateTo: "protototo/season",
      },
    ],
  },
  {
    title: "dashboard.documents.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.documents.categories",
        navigateTo: "documents/",
      },
      {
        title: "dashboard.documents.createCategory",
        navigateTo: "documents/category",
      },
    ],
  },
];

const DrawerItemComponent: React.FC<DrawerItem> = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  const [items, setItems] = React.useState<DrawerItem[]>(publicItems);

  const location = useLocation();

  React.useEffect(() => {
    if (!roles) {
      return;
    }

		let newItems: DrawerItem[] = [...publicItems];

		if (!isAnonymous) {
			newItems = [...newItems, ...defaultItems]
		}

    if (
      (roles.includes(Roles.ADMIN) || roles.includes(Roles.BOARD)) &&
      !items.includes(adminDefaultItem) &&
      !location.pathname.includes("dashboard")
    ) {
      newItems = [...newItems, adminDefaultItem];
    }

		setItems(newItems.sort((a, b) => (a.rank ?? -1) - (b.rank ?? -1)));
  }, [location.pathname, roles, isAnonymous]);

  React.useEffect(() => {
    if (location.pathname.includes("dashboard")) {
      setItems(adminItems);
    }
  }, [location.pathname]);

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
