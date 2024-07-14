import { useAppSelector } from "../../store/hooks";

export default function isAuthenticated(): boolean {
  const refreshToken = useAppSelector(state => state.auth.refreshToken);

  return refreshToken !== undefined;
}
