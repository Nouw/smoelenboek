import { AppBar, Box, CssBaseline, Drawer, IconButton, Toolbar } from "@mui/material";
import React from "react";
import { Outlet } from "react-router-dom";
import MenuIcon from "@mui/icons-material/Menu";
import { AppBarLayout } from "./app-bar.layout";
import { DrawerLayout } from "./drawer/drawer.layout";

const drawerWidth = 240;

export const AppLayout: React.FC = () => {
  const container = window !== undefined
    ? () => window.document.body
    : undefined;

  //const language = useAppSelector((state) => state.auth.language);
  //const { i18n } = useTranslation();

  const [mobileOpen, setMobileOpen] = React.useState(false);

  //React.useEffect(() => {
  //  const changeLanguage = async () => {
  //    await i18n.changeLanguage(language);
  //  };
  //
  //  changeLanguage();
  //}, [i18n, language]);
  //
  //React.useEffect(() => {
  //  if (language === i18n.language) return;
  //
  //  const setLanguage = async () => {
  //    if (navigator.language.toLowerCase().includes("nl")) {
  //      await i18n.changeLanguage("nl");
  //    } else {
  //      await i18n.changeLanguage("en");
  //    }
  //  };
  //
  //  setLanguage();
  //}, [i18n, language]);

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

            <AppBarLayout />
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
            <DrawerLayout />
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
            <DrawerLayout />
          </Drawer>
        </Box>
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 4,
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            height: 'calc(100% - 64px)'
          }}
        >
          <Toolbar />
          <Outlet />
        </Box>
      </Box>
    </>
  );
}
