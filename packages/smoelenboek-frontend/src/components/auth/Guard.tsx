import React, { ReactNode } from "react"
import { Roles } from "smoelenboek-types"
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

	throw new Error("User does not have permission to visit page");
}
