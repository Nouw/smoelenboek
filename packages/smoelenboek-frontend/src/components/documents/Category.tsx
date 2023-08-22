import React from "react";
import {Collapse, List, ListItemButton, ListItemText} from "@mui/material";
import {ExpandLess, ExpandMore} from "@mui/icons-material";

interface CategoryProps {
  name: string,
  defaultOpen?: boolean
  children?: JSX.Element
}

export const Category: React.FC<CategoryProps> = (props) => {
  const [open, setOpen] = React.useState<boolean>(props.defaultOpen ?? false);

  return (
    <>
      <ListItemButton onClick={() => setOpen(!open)}>
        <ListItemText primary={props.name}/>
        {open ? <ExpandLess /> : <ExpandMore />}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List>
          {props.children}
        </List>
      </Collapse>
    </>
  )
}
