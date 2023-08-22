import React from "react";
import {Collapse, List, ListItem, ListItemButton, ListItemText} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";
import { Seasons } from "../../screens/Profile";

interface SeasonProps {
  season: Seasons
}

export const Season: React.FC<SeasonProps> = (props) => {
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
              <ListItemText primary={item.committee ? item.committee?.name : item.team?.name} secondary={item.function} />
            </ListItem>
          ))}
        </List>
      </Collapse>
    </>
  )
}
