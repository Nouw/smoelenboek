import { ActionFunction } from "react-router-dom";
import { teamsApiSlice } from "../../api/endpoints/teams.api"
import { store } from "../../store/store"

export const teamsLoader: ActionFunction = async () => {
  const req = store.dispatch(teamsApiSlice.endpoints.getTeams.initiate());

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

export const teamsInfoLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(teamsApiSlice.endpoints.getTeam.initiate(+params.id!, { forceRefetch: true }));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}
