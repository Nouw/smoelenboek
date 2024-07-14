import React from "react";
import {Collapse, List, ListItem, ListItemButton, ListItemText} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import { Seasons } from "../../screens/profiles/profile";
import {useTranslation} from "react-i18next";

interface SeasonProps {
  season: Seasons
}

export const Season: React.FC<SeasonProps> = (props) => {
  const i18n = useTranslation("functions");
  const [open, setOpen] = React.useState<boolean>(false);

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)}>
        <ListItemText primary={props.season.name} />
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding>
          {props.season.data.map((item) => (
            <ListItem key={item.id} sx={{pl: 4}}>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              <ListItemText primary={item.committee ? item.committee?.name : item.team?.name} secondary={i18n.t(`${item.function}`)} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  )
}
