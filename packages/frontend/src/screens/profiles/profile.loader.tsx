import { ActionFunction } from "react-router-dom";
import { store } from "../../store/store"
import { userApiSlice } from "../../api/endpoints/user.api";

export const profileLoader: ActionFunction = async ({ params }) => {
  const req = store.dispatch(userApiSlice.endpoints.getProfile.initiate(+params.id!));

  try {
    const response = await req.unwrap();
    return response;
  } catch (e) {
    throw new Response("Something went wrong!", { status: 500 });
  } finally {
    req.unsubscribe()
  }
}

