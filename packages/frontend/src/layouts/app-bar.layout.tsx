import React from "react";
import { useTranslation } from "react-i18next";
import { useAppSelector, useAppDispatch } from "../store/hooks";
import isAuthenticated from "../hooks/auth/is-authenticated.hook";
import { useNavigate } from "react-router-dom";
import { useLazyGetProfilePictureQuery } from "../api/endpoints/user.api";
import { Avatar, Box, Button, IconButton, Menu, MenuItem, Stack } from "@mui/material";
import { red } from "@mui/material/colors";
import { logout } from "../store/slices/auth.slice";

export const AppBarLayout: React.FC = () => {
  const { t } = useTranslation(["menu"]);

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const id = useAppSelector((state) => state.auth.id);
  const authenticated = isAuthenticated();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [trigger, { data }] = useLazyGetProfilePictureQuery();

  React.useEffect(() => {
    const getPicture = async () => {
      await trigger();
    };

    if (authenticated) {
      getPicture();
    }

  }, [trigger, authenticated]);

  React.useEffect(() => {
    document.addEventListener("profilePictureUpdate", async () => {
      await trigger();
    });

    return () => {
      document.removeEventListener(
        "profilePictureUpdate",
        () => console.log("Stopped listening to picture updates"),
      );
    };
  }, [trigger]);

  function closeMenu() {
    setMenuAnchor(null);
  }

  if (!id || !authenticated) {
    return (
      <Box sx={{ flexGrow: 0 }}>
        <Button
          onClick={() => navigate("/auth/login")}
          variant="outlined"
          sx={{
            color: red[50],
            borderColor: red[50],
            "&:hover": { borderColor: red[200], color: red[200] },
          }}
        >
          Login
        </Button>
      </Box>
    );
  }
  console.log(import.meta.env.VITE_APP_OBJECT_STORAGE_URL, data)
  return (
    <>
      <Box sx={{ flexGrow: 0 }}>
        <Stack spacing={2} direction="row" alignItems="center">
          <IconButton
            size="large"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <Avatar
              src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${data?.picture ?? "user/default.jpg"
                }`}
            />
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
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate(`/profile/${id ?? 1}`);
          }}
        >
          {t("profile")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate(`/settings`);
          }}
        >
          {t("settings")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate(`/`);
            dispatch(logout());
          }}
        >
          {t("logout")}
        </MenuItem>
      </Menu>
    </>
  );
}
