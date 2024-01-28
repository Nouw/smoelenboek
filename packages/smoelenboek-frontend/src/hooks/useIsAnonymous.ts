import { Roles } from "smoelenboek-types"
import { useAppSelector } from "../store/hooks"

export const useIsAnonymous = (): boolean => {
	const roles = useAppSelector(state => state.auth.roles);
	return roles.includes(Roles.ANONYMOUS) || roles.length < 1;
}
