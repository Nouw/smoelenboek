import React from "react";
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { useLazyGetProfilePictureQuery } from "../../api/endpoints/auth";
import { SearchUser } from "../SearchUser";
import { useTranslation } from "react-i18next";
import { red } from "@mui/material/colors";

interface AppBarRightWidgetProps {}

export const AppBarRightWidget: React.FC<AppBarRightWidgetProps> = () => {
  const { i18n } = useTranslation();

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const id = useAppSelector((state) => state.auth.id);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [trigger, { data }] = useLazyGetProfilePictureQuery();

  React.useEffect(() => {
    const getPicture = async () => {
      await trigger();
    };

    getPicture();
  }, [trigger]);

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

  if (!id) {
    return (
      <Box sx={{ flexGrow: 0 }}>
        <Button
          onClick={() => navigate("/login")}
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

  return (
    <>
      <Box sx={{ flexGrow: 0 }}>
        <Stack spacing={2} direction="row" alignItems="center">
          <SearchUser
            inDrawer
            onSelect={(user) => navigate(`/profile/${user.id}`)}
          />
          <IconButton
            size="large"
            onClick={(e) => setMenuAnchor(e.currentTarget)}
          >
            <Avatar
              src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${
                data?.data ?? "/user/default.jpg"
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
          {i18n.t("menu.profile")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            navigate(`/settings`);
          }}
        >
          {i18n.t("settings.settings")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            closeMenu();
            dispatch(logout(undefined));
          }}
        >
          {i18n.t("menu.logout")}
        </MenuItem>
      </Menu>
    </>
  );
};
