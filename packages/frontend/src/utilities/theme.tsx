import { createTheme, useMediaQuery } from "@mui/material";
import React from "react";

export const getTheme = () => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = React.useMemo(
    () =>
      createTheme({
        palette: {
          primary: {
            main: "#d0211c",
          },
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode],
  );

  return theme;
}
