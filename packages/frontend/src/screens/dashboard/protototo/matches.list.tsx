import { Button } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";

export const MatchesList: React.FC = () => {
  const navigate = useNavigate();

  return <>
    <Button variant="contained" onClick={() => navigate(`/dashboard/protototo/matches/add`)}>Add Match</Button>
  </>;
};
