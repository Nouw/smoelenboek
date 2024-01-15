import React from "react";
import {Create} from "../../dashboard/activity/Create.tsx";
import {Box, Typography} from "@mui/material";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  return <Box>
    <Create/>
  </Box>
}
