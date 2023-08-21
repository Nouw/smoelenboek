import React from "react";
import {
  AppBar,
  Avatar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  Menu, MenuItem, Stack,
  Toolbar
} from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import {Outlet, useNavigate} from "react-router-dom";
import {DrawerItems} from "./DrawerItems";
import {useAppDispatch, useAppSelector} from "../../store/hooks";
import {logout} from "../../store/feature/auth.slice";
import {Copyright} from "../Copyright";
import {useTranslation} from "react-i18next";
import {useLazyGetProfilePictureQuery} from "../../api/endpoints/auth";
import {SearchUser} from "../SearchUser";

interface ScreenWrapperProps {
  admin?: boolean
}

const drawerWidth = 240;

export const ScreenWrapper: React.FC<ScreenWrapperProps> = () => {
  const container = window !== undefined ? () => window.document.body : undefined;

  const language = useAppSelector((state) => state.auth.language);
  const id = useAppSelector(state => state.auth.id);
  const { i18n } = useTranslation();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [trigger, { data }] = useLazyGetProfilePictureQuery();

  React.useEffect(() => {
    const getPicture = async () => {
      await trigger()
    };

    getPicture();
  }, [trigger])

  React.useEffect(() => {
    const changeLanguage = async () => {
      await i18n.changeLanguage(language);
    }

    changeLanguage();
  }, [i18n, language])

  React.useEffect(() => {
    if (language === i18n.language) return;

    const setLanguage = async () => {
      if (navigator.language.toLowerCase().includes("nl")) {
        await i18n.changeLanguage("nl");
      } else {
        await i18n.changeLanguage("en");
      }
    }

    setLanguage();
  }, [i18n, language])

  React.useEffect(() => {
    document.addEventListener("profilePictureUpdate", async () => {
      await trigger();
    })

    return () => {
      document.removeEventListener("profilePictureUpdate", () => console.log("Stopped listening to picture updates"))
    }
  }, [trigger])

  function closeMenu() {
    setMenuAnchor(null);
  }

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <CssBaseline/>
        <AppBar
          position="fixed"
          color="primary"
          enableColorOnDark
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
          }}
        >
          <Toolbar>
            <Box sx={{flexGrow: 1}}>
              <IconButton size="large" sx={{ mr: 2, display: { sm: 'none' } }} onClick={() => setMobileOpen(!mobileOpen)}>
                <MenuIcon/>
              </IconButton>
            </Box>
            <Box sx={{flexGrow: 0}}>
              <Stack spacing={2} direction="row" alignItems="center">
                <SearchUser inDrawer onSelect={(user) => navigate(`/profile/${user.id}`)}/>
                <IconButton size="large" onClick={(e) => setMenuAnchor(e.currentTarget)}>
                  <Avatar src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${data?.data ?? '/user/default.jpg'}`}/>
                </IconButton>
              </Stack>
            </Box>
            <Menu
              id="menu-appbar"
              anchorEl={menuAnchor}
              keepMounted
              open={Boolean(menuAnchor)}
              onClose={closeMenu}
            >
              <MenuItem onClick={() => {closeMenu(); navigate(`/profile/${id ?? 1}`)}}>Profile</MenuItem>
              <MenuItem onClick={() => {closeMenu(); navigate(`/settings`)}}>Settings</MenuItem>
              <MenuItem onClick={() => {closeMenu(); dispatch(logout(undefined))}}>Logout</MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            <DrawerItems/>
            <Copyright/>
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
            open
          >
            <DrawerItems/>
            <Copyright/>
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${drawerWidth}px)` } }}
        >
          <Toolbar/>
          <Outlet/>
        </Box>
      </Box>
    </>

  )
}
