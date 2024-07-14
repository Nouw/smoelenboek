import React from "react";
import { useLocation } from "react-router-dom";
import { DrawerDashboardLayout } from "./drawer-dashboard.layout";
import { DrawerDefaultLayout } from "./drawer-default.layout";

export const DrawerLayout: React.FC = () => {
  const location = useLocation();
  const inDashboard = location.pathname.startsWith("/dashboard");
  return <>{inDashboard ? <DrawerDashboardLayout /> : <DrawerDefaultLayout />}</>;
}
