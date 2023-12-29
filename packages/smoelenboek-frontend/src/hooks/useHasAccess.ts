import { Roles } from "smoelenboek-types";
import { useAppSelector } from "../store/hooks";
import { RolesHierarchy } from "smoelenboek-types";

export const useHasAccess = (roles: Roles[]) => {
	const authRoles = useAppSelector(state => state.auth.roles);
	const allRoles = new Set();
	
	for (const role of authRoles) {
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
		return true;
	}

	return false;

}
