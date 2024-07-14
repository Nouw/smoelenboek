import React from "react";
import isAuthenticated from "../hooks/auth/is-authenticated.hook";
import { Outlet } from "react-router-dom";

export const ProtectedLayout: React.FC = () => {
  const authenticated = isAuthenticated();

  if (!authenticated) {
    throw new Response("Not authorized", { status: 403 });
  }

  return <Outlet/>
}
