import React from "react";
import {Navigate} from "react-router-dom";
import {useAppSelector} from "../../store/hooks";
import {isAdmin} from "../../utilities/permissions";
import history from "../../utilities/history";

interface AdminRouteProps {
  children: JSX.Element
}

export const AdminRoute: React.FC<AdminRouteProps> = (props) => {
  const roles = useAppSelector(state => state.auth.roles);


  if (!isAdmin(roles ?? [])) {
    return <Navigate to="/home" state={{ from: history.location }}/>
  }

  return props.children
}
