import React from "react";
import {CardMedia} from "@mui/material";

interface PhotoProps {
  path: string
}

export const Photo: React.FC<PhotoProps> = ({ path }) => {
  return <CardMedia src={`${import.meta.env.VITE_APP_OBJECT_STORAGE_URL}/${path}`} component="img" height="194"/>
}
