import React from "react";
import {
  AppBar, 
  Box,
  CssBaseline,
  Drawer,
  IconButton, 
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { Outlet } from "react-router-dom";
import { DrawerItems } from "./DrawerItems";
import { Copyright } from "../Copyright";
import { useTranslation } from "react-i18next";
import { AppBarRightWidget } from "../app-bar/AppBarRightWidget";
import { useAppSelector } from "../../store/hooks";

interface ScreenWrapperProps {
  admin?: boolean;
}

const drawerWidth = 240;

export const ScreenWrapper: React.FC<ScreenWrapperProps> = () => {
  const container = window !== undefined
    ? () => window.document.body
    : undefined;

  const language = useAppSelector((state) => state.auth.language); 
  const { i18n } = useTranslation();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  
  React.useEffect(() => {
    const changeLanguage = async () => {
      await i18n.changeLanguage(language);
    };

    changeLanguage();
  }, [i18n, language]);

  React.useEffect(() => {
    if (language === i18n.language) return;

    const setLanguage = async () => {
      if (navigator.language.toLowerCase().includes("nl")) {
        await i18n.changeLanguage("nl");
      } else {
        await i18n.changeLanguage("en");
      }
    };

    setLanguage();
  }, [i18n, language]); 

  return (
    <>
      <Box sx={{ display: "flex" }}>
        <CssBaseline />
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
            <Box sx={{ flexGrow: 1 }}>
              <IconButton
                size="large"
                sx={{ mr: 2, display: { sm: "none" } }}
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                <MenuIcon />
              </IconButton>
            </Box>
            <AppBarRightWidget />
          </Toolbar>
        </AppBar>
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            container={container}
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            sx={{
              display: { xs: "block", sm: "none" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
          >
            <DrawerItems />
            <Copyright />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", sm: "block" },
              "& .MuiDrawer-paper": {
                boxSizing: "border-box",
                width: drawerWidth,
              },
            }}
            open
          >
            <DrawerItems />
            <Copyright />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </>
  );
};
