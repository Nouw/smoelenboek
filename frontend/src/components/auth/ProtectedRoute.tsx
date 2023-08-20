import React from "react";
import {useAppSelector} from "../../store/hooks";
import {Navigate, useNavigate} from "react-router-dom";
import history from "../../utilities/history";

interface ProtectedRouteProps {
  children: JSX.Element
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = (props) => {
  const auth = useAppSelector(state => state.auth);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (window.location.pathname === "/") {
      navigate('teams/female');
    }
  }, [navigate])

  if (!auth.accessToken || !auth.id) {
    return <Navigate to="/login" state={{ from: history.location }}/>
  }

  return props.children
}
