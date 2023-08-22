import React from "react";
import {List, ListItemButton, ListItemText, ListSubheader} from "@mui/material";
import {useLocation, useNavigate} from "react-router-dom";
import {useAppSelector} from "../../store/hooks";
import { isAdmin } from "../../utilities/permissions";
import {useTranslation} from "react-i18next";

interface DrawerItemsProps {
  admin?: boolean
}

interface DrawerItem {
  title: string;
  navigateTo?: string;
  subheader?: boolean;
  subItems?: DrawerItem[];
  translateHeader?: boolean;
}

const defaultItems: DrawerItem[] = [
  {
    title: "Teams",
    subheader: true,
    subItems: [
      {
        title: "navigation.teams.women",
        navigateTo: "teams/female"
      },
      {
        title: "navigation.teams.men",
        navigateTo: "teams/male"
      },
    ]
  },
  {
    title: "Protototo",
    subheader: true,
    subItems: [
      {
        title: "navigation.protototo.predict",
        navigateTo: "protototo"
      },
      // {
      //   title: "Leaderboards",
      //   navigateTo: ""
      // },
    ]
  },
  {
    title: "navigation.documents",
    navigateTo: "documents/"
  },
  {
    title: "Sponsorhengel",
    navigateTo: "sponsorhengel"
  },
  {
    title: 'navigation.vcp',
    navigateTo: "vcp"
  }
];

const adminDefaultItem: DrawerItem =  {
      title: "navigation.administration",
      subheader: true,
      translateHeader: true,
      subItems: [
        {
          title: "Dashboard",
          navigateTo: "dashboard/"
        }
      ]
    };

const adminItems: DrawerItem[] = [
  {
    title: "dashboard.goBack",
    translateHeader: true,
    navigateTo: '/teams/female'
  },
  {
    title: "dashboard.form.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.form.createForm",
        navigateTo: "form/create"
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
        navigateTo: "seasons/"
      },
      {
        title: "dashboard.season.createSeason",
        navigateTo: "seasons/add"
      }
    ]
  },
  {
    title: "dashboard.user.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.user.users",
        navigateTo: "users/"
      },
      {
        title: "dashboard.user.createUser",
        navigateTo: "users/add"
      }
    ]
  },
  {
    title: "dashboard.team.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.team.teams",
        navigateTo: "teams/"
      },
      {
        title: "dashboard.team.createTeam",
        navigateTo: "teams/add"
      }
    ]
  },
  {
    title: "dashboard.committee.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.committee.committees",
        navigateTo: 'committees/'
      },
      {
        title: "dashboard.committee.createCommittee",
        navigateTo: "committees/add"
      }
    ]
  },
  {
    title: "dashboard.protototo.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.protototo.seasons",
        navigateTo: 'protototo/'
      },
      {
        title: "dashboard.protototo.createSeason",
        navigateTo: 'protototo/season'
      }
    ]
  },
  {
    title: "dashboard.documents.header",
    subheader: true,
    translateHeader: true,
    subItems: [
      {
        title: "dashboard.documents.categories",
        navigateTo: 'documents/'
      },
      {
        title: "dashboard.documents.createCategory",
        navigateTo: 'documents/category'
      }
    ]
  }
]

const DrawerItemComponent: React.FC<DrawerItem> = (props) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  if (props.subheader) {
    return <ListSubheader>
      {props.translateHeader ? t(props.title) : props.title}
    </ListSubheader>
  }

  function onClick() {
    if (props.navigateTo) {
      navigate(props.navigateTo)
    }
  }

  return <ListItemButton onClick={() => onClick()}>
    <ListItemText primary={t(props.title)}/>
  </ListItemButton>
}

export const DrawerItems: React.FC<DrawerItemsProps> = () => {
  const roles = useAppSelector(state => state.auth.roles);

  const [items, setItems] = React.useState<DrawerItem[]>(defaultItems);

  const location = useLocation();

  React.useEffect(() => {
    if (!roles) {
      return;
    }

    if (isAdmin(roles) && !items.includes(adminDefaultItem) && !location.pathname.includes("dashboard")) {
      setItems([...items, adminDefaultItem]);
    }
  }, [items, location.pathname, roles])

  React.useEffect(() => {
    if (location.pathname.includes("dashboard")) {
      setItems(adminItems);
    }
  }, [location.pathname])

  return (
    <List>
      {items.map((item) => (
        <>
          <DrawerItemComponent {...item}/>
          {item.subItems && item.subItems.map((subItem) => (
            <List sx={{pl: 4}} disablePadding>
              <DrawerItemComponent {...subItem} />
            </List>
          ))}
        </>
      ))}
    </List>
  )
}
