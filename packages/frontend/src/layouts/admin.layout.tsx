import React from "react";
import { isAdmin } from "../hooks/auth/is-admin.hook";
import { Outlet } from "react-router-dom";

export const AdminLayout: React.FC = () => {
  const admin = isAdmin();

  if (!admin) {
    throw new Response("Forbidden", { status: 403 });
  }

  return <Outlet />
}
