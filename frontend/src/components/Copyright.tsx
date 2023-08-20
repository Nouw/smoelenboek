import React from "react";
import {Box, Typography} from "@mui/material";

interface CopyrightProps {

}

export const Copyright: React.FC<CopyrightProps> = () => {
  return (
    <Box style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', justifyContent: 'center', alignItems: 'center'}}>
      <Typography variant="caption">© WebCie v{import.meta.env.VITE_APP_VERSION}</Typography>
    </Box>
  )
}
