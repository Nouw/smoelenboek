import React, { ReactNode } from "react"
import { Roles, RolesHierarchy } from "smoelenboek-types"
import { useAppSelector } from "../../store/hooks"
import { Navigate } from "react-router-dom";

interface GuardProps {
	roles: Roles[];
	children: ReactNode
}

export const Guard: React.FC<GuardProps> = ({ roles, children }) => {
	const userRoles = useAppSelector(state => state.auth.roles);
	const allRoles = new Set();

	for (const role of userRoles) {
		const childRoles = RolesHierarchy.get(role);
		
		allRoles.add(role);
		
		if (!childRoles) {
			continue;
		}

		for (const child of childRoles) {
			allRoles.add(child);
		}
	}

	if (roles.every(role => allRoles.has(role))) {
		return children;
	}

	// TODO: Return to an unauthorized path 
	return <Navigate to="/" />;
}
