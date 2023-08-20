import React from 'react';
import { IconButton, Menu } from '@mui/material';
import { MoreVert } from '@mui/icons-material';

type OptionsProps = {
  children?: JSX.Element[] | JSX.Element
}

export const Options: React.FC<OptionsProps> = ({ children }) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    function handleOpen(event: React.MouseEvent<HTMLButtonElement>) {
      setAnchorEl(event.currentTarget);
    }

    function handleClose() {
      setAnchorEl(null);
    }

    return (
      <>
        <IconButton
          onClick={handleOpen}
          aria-haspopup="true"
          aria-controls={open ? 'basic-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          id="basic-button"
        >
          <MoreVert/>
        </IconButton>
        <Menu
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          id="basic-menu"
          MenuListProps={{
            'aria-labelledby': 'basic-button'
          }}
        >
          { children }
        </Menu>
      </>
    )
}

