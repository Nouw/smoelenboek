import React from "react";
import {Navigate} from "react-router-dom";
import {useAppSelector} from "../../store/hooks";
import {isAdmin} from "../../utilities/permissions";
import history from "../../utilities/history";
import { Roles } from 'smoelenboek-types';

interface AdminRouteProps {
  children: JSX.Element
}

export const AdminRoute: React.FC<AdminRouteProps> = (props) => {
  const roles = useAppSelector(state => state.auth.roles);


  if (!(roles.includes(Roles.ADMIN) || roles.includes(Roles.BOARD))) {
    return <Navigate to="/teams/female" state={{ from: history.location }}/>
  }

  return props.children
}
