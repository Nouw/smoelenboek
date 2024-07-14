import { ListItemButton, ListItemText, ListSubheader } from "@mui/material";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import React from "react";

export interface DrawerItem {
  title: string;
  navigateTo?: string;
  subheader?: boolean;
  subItems?: DrawerItem[];
  translateHeader?: boolean;
  rank?: number; // Bigger the number the lower in the list
}

export const DrawerItemComponent: React.FC<DrawerItem> = (props) => {
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

