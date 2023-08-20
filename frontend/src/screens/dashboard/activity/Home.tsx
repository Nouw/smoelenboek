import React from "react";
import {Create} from "./form/Create";
import {Box, Typography} from "@mui/material";

interface HomeProps {

}

export const Home: React.FC<HomeProps> = () => {
  return <Box>
    <Typography>Hello world</Typography>
    <Create/>
  </Box>
}
