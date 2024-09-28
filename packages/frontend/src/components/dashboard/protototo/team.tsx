import React from "react";
import { useGetNevoboTeamQuery } from "../../../api/endpoints/nevobo.api.ts";
import { Loading } from "../../loading.tsx";
import { Typography } from "@mui/material";

export const Team: React.FC<{ id: string }> = ({ id }) => {
  const { data, isLoading } = useGetNevoboTeamQuery(encodeURIComponent(id));

  if (isLoading) {
    return <Loading />;
  }
  // Most retarded way of dealing with teams I have seen in a while
  return <Typography variant="h6">{data.omschrijving}</Typography>;
};
