import { useAppSelector } from "../../store/hooks"

export const isAdmin = () => {
  const role = useAppSelector(state => state.auth.role);

return role === "admin";
}
