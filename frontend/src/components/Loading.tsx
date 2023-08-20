import React from "react";
import {Box, CircularProgress} from "@mui/material";

interface LoadingProps {

}

export const Loading: React.FC<LoadingProps> = () => {
  return <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress/>
  </Box>
}
