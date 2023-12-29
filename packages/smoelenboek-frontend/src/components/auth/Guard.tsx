import React, { ReactNode } from "react"
import { Roles } from "smoelenboek-types"
import { Navigate } from "react-router-dom";
import { useHasAccess } from "../../hooks/useHasAccess";

interface GuardProps {
	roles: Roles[];
	children: ReactNode
}

export const Guard: React.FC<GuardProps> = ({ roles, children }) => {	
	const hasRoles = useHasAccess(roles);

	if (hasRoles) {
		return children;
	}

	// TODO: Return to an unauthorized path 
	return <Navigate to="/home" />;
}
